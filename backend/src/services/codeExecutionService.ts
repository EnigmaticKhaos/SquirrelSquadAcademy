import axios from 'axios';
import https from 'https';
import logger from '../utils/logger';
import { SupportedLanguage } from '../models/CodeSnippet';

// Judge0 API configuration
// Supports both RapidAPI-hosted and self-hosted instances
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN; // For self-hosted instances

// Determine if using RapidAPI or self-hosted
// If JUDGE0_API_URL is explicitly set and not the default RapidAPI URL, it's self-hosted
const IS_RAPIDAPI = JUDGE0_API_URL.includes('rapidapi.com');
const IS_SELF_HOSTED = !!process.env.JUDGE0_API_URL && !IS_RAPIDAPI;

// Judge0 is enabled if we have either:
// 1. RapidAPI key (for RapidAPI-hosted)
// 2. Custom URL set (for self-hosted)
const USE_JUDGE0 = !!JUDGE0_API_KEY || IS_SELF_HOSTED;

// Piston API configuration (alternative)
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Language ID mapping for Judge0
const JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  javascript: 63, // Node.js
  typescript: 74, // TypeScript
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
  swift: 83,
  kotlin: 78,
  dart: 69,
  r: 80,
  sql: 82,
  html: 56,
  css: 55,
  bash: 46,
  powershell: 70,
};

// Language name mapping for Piston
const PISTON_LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  dart: 'dart',
  r: 'r',
  sql: 'sql',
  html: 'html',
  css: 'css',
  bash: 'bash',
  powershell: 'powershell',
};

export interface CodeExecutionResult {
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  status: 'success' | 'error' | 'timeout' | 'runtime_error';
}

/**
 * Execute code using Judge0 API
 */
const executeWithJudge0 = async (
  code: string,
  language: SupportedLanguage,
  stdin?: string
): Promise<CodeExecutionResult> => {
  try {
    const languageId = JUDGE0_LANGUAGE_IDS[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Build headers based on whether using RapidAPI or self-hosted
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (IS_RAPIDAPI) {
      // RapidAPI requires these specific headers
      headers['X-RapidAPI-Key'] = JUDGE0_API_KEY || '';
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    } else if (IS_SELF_HOSTED && JUDGE0_AUTH_TOKEN) {
      // Self-hosted Judge0 with authentication
      headers['X-Auth-Token'] = JUDGE0_AUTH_TOKEN;
    }
    // If self-hosted without auth token, no auth headers are sent

    // Submit code for execution
    const submitResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions`,
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        cpu_time_limit: 5, // 5 seconds
        memory_limit: 128000, // 128 MB
      },
      {
        headers,
        params: {
          base64_encoded: 'false',
          wait: true, // Wait for execution to complete (boolean, not string)
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certificates for self-hosted instances
        }),
      }
    );

    const submitData = submitResponse.data;
    const token = submitData.token;

    if (!token) {
      throw new Error('Judge0 did not return a token');
    }

    logger.info('Judge0 submission response:', {
      hasToken: !!token,
      token,
      hasStatus: !!submitData.status,
      statusId: submitData.status?.id,
      hasStdout: !!submitData.stdout,
      stdoutPreview: submitData.stdout?.substring(0, 100),
    });

    // When wait=true, Judge0 may return the full result in the initial response
    // But some instances only return a token, so we always fetch the result to be safe
    let result = submitData;
    
    // Always fetch the result by token to ensure we have the complete execution result
    // This handles cases where wait=true doesn't return the full result immediately
    if (token) {
      logger.info('Fetching result for token:', token);
      // Build headers for result request
      const resultHeaders: Record<string, string> = {};
      if (IS_RAPIDAPI) {
        resultHeaders['X-RapidAPI-Key'] = JUDGE0_API_KEY || '';
        resultHeaders['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      } else if (IS_SELF_HOSTED && JUDGE0_AUTH_TOKEN) {
        resultHeaders['X-Auth-Token'] = JUDGE0_AUTH_TOKEN;
      }

      // Get execution result - poll until we get a final status
    // Status 1 = In Queue, 2 = Processing, 3+ = Final status
    let resultResponse: any = null;
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds
    const pollInterval = 1000; // 1 second
    
    while (attempts < maxAttempts) {
      resultResponse = await axios.get(
        `${JUDGE0_API_URL}/submissions/${token}`,
        {
          headers: resultHeaders,
          params: {
            base64_encoded: 'false',
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      );
      
      const currentResult = resultResponse.data;
      const statusId = currentResult.status?.id;
      
      // Status 1 = In Queue, 2 = Processing - keep polling
      // Status 3+ = Final status (Accepted, Error, etc.)
      if (statusId && statusId > 2) {
        logger.info(`Got final status ${statusId} after ${attempts} attempts`);
        break;
      }
      
      // If still processing, wait and retry
      if (statusId === 1 || statusId === 2) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
      }
      
      break;
    }
    
    if (!resultResponse) {
      throw new Error('Failed to get execution result from Judge0');
    }

      result = resultResponse.data;
      logger.info('Judge0 result fetched:', {
        statusId: result.status?.id,
        statusDescription: result.status?.description,
        hasStdout: !!result.stdout,
        stdoutValue: result.stdout,
        stdoutLength: result.stdout?.length || 0,
        hasStderr: !!result.stderr,
        stderrValue: result.stderr,
      });
    } else {
      // If we got the full result in the initial response, use it
      logger.info('Using result from initial response');
    }

    // Map Judge0 status to our status
    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit, 6=Compilation Error, 7-12=Runtime Errors
    let status: CodeExecutionResult['status'] = 'success';
    const statusId = result.status?.id;
    
    logger.info('Processing Judge0 result:', {
      statusId,
      statusDescription: result.status?.description,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compile_output,
    });
    
    if (statusId === 1 || statusId === 2) {
      // Still processing - this shouldn't happen with wait=true, but handle it
      logger.warn('Judge0 result still processing', { statusId, token });
      status = 'error';
    } else if (statusId === 3) {
      // Accepted - success
      status = 'success';
    } else if (statusId === 4 || statusId === 5) {
      // Wrong Answer or Time Limit Exceeded
      status = 'error';
    } else if (statusId === 6) {
      // Compilation Error
      status = 'error';
    } else if (statusId >= 7 && statusId <= 12) {
      // Runtime Errors (7=SIGSEGV, 8=SIGXFSZ, 9=SIGFPE, 10=SIGABRT, 11=NZEC, 12=Other)
      status = 'runtime_error';
    } else if (statusId === 13 || statusId === 14) {
      // Internal Error or Exec Format Error
      status = 'error';
    }

    // Handle both string and null/empty stdout
    const output = result.stdout !== null && result.stdout !== undefined && result.stdout !== '' 
      ? result.stdout 
      : undefined;
    const error = result.stderr || result.compile_output || undefined;

    logger.info('Judge0 execution result:', {
      statusId: result.status?.id,
      statusDescription: result.status?.description,
      hasStdout: !!result.stdout,
      hasStderr: !!result.stderr,
      stdoutLength: result.stdout?.length || 0,
    });

    return {
      output,
      error,
      executionTime: result.time ? parseFloat(result.time) * 1000 : undefined, // Convert to milliseconds
      memoryUsed: result.memory ? result.memory * 1024 : undefined, // Convert to bytes
      status,
    };
  } catch (error: any) {
    // Enhanced error logging for debugging
    const errorDetails = {
      message: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      url: JUDGE0_API_URL,
      isRapidAPI: IS_RAPIDAPI,
      isSelfHosted: IS_SELF_HOSTED,
      hasAuthToken: !!JUDGE0_AUTH_TOKEN,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
    
    logger.error('Error executing code with Judge0:', JSON.stringify(errorDetails, null, 2));
    
    // Create error with status code for proper HTTP response
    const appError: any = new Error();
    appError.isOperational = true;
    
    // Provide more helpful error messages with specific guidance
    if (error.code === 'ECONNREFUSED') {
      appError.message = `Cannot connect to Judge0 at ${JUDGE0_API_URL}. Check if the service is running and the URL is correct.`;
      appError.statusCode = 503; // Service Unavailable
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      appError.message = `Connection to Judge0 timed out. The service at ${JUDGE0_API_URL} may be slow or unreachable.`;
      appError.statusCode = 504; // Gateway Timeout
    } else if (error.message?.includes('SSL') || error.message?.includes('TLS') || error.message?.includes('EPROTO') || error.code === 'EPROTO' || error.code === 'CERT_HAS_EXPIRED') {
      appError.message = `SSL/TLS error connecting to ${JUDGE0_API_URL}. If using self-signed certificates, ensure the service is accessible. Try HTTP instead of HTTPS if SSL is not configured.`;
      appError.statusCode = 502; // Bad Gateway
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      appError.message = `Cannot resolve hostname for ${JUDGE0_API_URL}. Check the URL is correct.`;
      appError.statusCode = 502; // Bad Gateway
    } else if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      // Handle 401 Unauthorized - indicates authentication is required
      if (status === 401) {
        appError.message = 'Authentication required for Judge0. Please set JUDGE0_AUTH_TOKEN environment variable.';
        appError.statusCode = 401;
      } else if (status === 404) {
        appError.message = `Judge0 endpoint not found at ${JUDGE0_API_URL}/submissions. Check the URL and ensure Judge0 is running.`;
        appError.statusCode = 404;
      } else {
        appError.message = `Judge0 returned error ${status}: ${error.response.statusText || ''}. ${responseData ? JSON.stringify(responseData) : ''}`;
        appError.statusCode = status >= 400 && status < 500 ? 400 : 502;
      }
    } else {
      // Include the original error message for debugging
      const errorMsg = error.message || 'Unknown error';
      appError.message = `Code execution failed: ${errorMsg} (Error code: ${error.code || 'none'})`;
      appError.statusCode = 500;
    }
    
    throw appError;
  }
};

/**
 * Execute code using Piston API
 */
const executeWithPiston = async (
  code: string,
  language: SupportedLanguage,
  stdin?: string
): Promise<CodeExecutionResult> => {
  try {
    const languageName = PISTON_LANGUAGE_NAMES[language];
    if (!languageName) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const response = await axios.post(
      `${PISTON_API_URL}/execute`,
      {
        language: languageName,
        version: '*', // Use latest version
        files: [
          {
            content: code,
          },
        ],
        stdin: stdin || '',
        args: [],
        compile_timeout: 10000, // 10 seconds
        run_timeout: 5000, // 5 seconds
        compile_memory_limit: -1,
        run_memory_limit: -1,
      },
      {
        timeout: 15000, // 15 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certificates for external APIs
        }),
      }
    );

    // Check for HTTP errors
    if (response.status >= 400) {
      throw new Error(`Piston API returned error: ${response.status} ${response.statusText}`);
    }

    const result = response.data;

    // Check if result has the expected structure
    if (!result || !result.run) {
      throw new Error('Invalid response from Piston API');
    }

    let status: CodeExecutionResult['status'] = 'success';
    if (result.run.code !== 0) {
      status = 'runtime_error';
    }

    return {
      output: result.run.stdout || undefined,
      error: result.run.stderr || result.compile?.stderr || undefined,
      executionTime: undefined, // Piston doesn't provide execution time
      memoryUsed: undefined, // Piston doesn't provide memory usage
      status,
    };
  } catch (error: any) {
    logger.error('Error executing code with Piston:', error);
    
    // Provide more helpful error messages
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Code execution service is temporarily unavailable. Please try again later.');
    }
    if (error.message?.includes('SSL') || error.message?.includes('TLS') || error.message?.includes('EPROTO')) {
      throw new Error('Connection error with code execution service. Please try again or contact support.');
    }
    if (error.response) {
      throw new Error(`Code execution failed: ${error.response.status} ${error.response.statusText}`);
    }
    throw new Error(`Code execution failed: ${error.message || 'Unknown error'}`);
  }
};

// Note: Piston API is kept as a reference implementation but is not used by default.
// To use Piston instead of Judge0, you would need to modify the executeCode function
// and set PISTON_API_URL environment variable.

/**
 * Execute code in browser (for JavaScript/TypeScript only)
 */
const executeInBrowser = async (
  code: string,
  language: SupportedLanguage
): Promise<CodeExecutionResult> => {
  // This would be handled on the frontend
  // For now, we'll return an error indicating browser execution should be used
  if (language === 'javascript' || language === 'typescript') {
    return {
      status: 'success',
      output: 'Code should be executed in browser',
    };
  }
  throw new Error('Browser execution only supported for JavaScript/TypeScript');
};

/**
 * Execute code
 */
export const executeCode = async (
  code: string,
  language: SupportedLanguage,
  stdin?: string
): Promise<CodeExecutionResult> => {
  // Log configuration for debugging (only in development or when explicitly enabled)
  if (process.env.NODE_ENV === 'development' || process.env.LOG_JUDGE0_CONFIG === 'true') {
    logger.info('Judge0 configuration:', {
      url: JUDGE0_API_URL,
      hasApiKey: !!JUDGE0_API_KEY,
      hasAuthToken: !!JUDGE0_AUTH_TOKEN,
      isRapidAPI: IS_RAPIDAPI,
      isSelfHosted: IS_SELF_HOSTED,
      useJudge0: USE_JUDGE0,
    });
  }

  // Check if Judge0 is configured
  if (!USE_JUDGE0) {
    const errorMessage = IS_SELF_HOSTED
      ? 'Code execution service is not configured. Please set JUDGE0_API_URL to your self-hosted Judge0 instance URL.'
      : 'Code execution service is not configured. Please set JUDGE0_API_KEY environment variable for RapidAPI, or set JUDGE0_API_URL for self-hosted instance. ' +
        'Get your API key from https://rapidapi.com/judge0-official/api/judge0-ce';
    const err: any = new Error(errorMessage);
    err.statusCode = 503; // Service Unavailable
    err.isOperational = true;
    throw err;
  }

  // Validate RapidAPI configuration
  if (IS_RAPIDAPI && !JUDGE0_API_KEY) {
    const err: any = new Error(
      'JUDGE0_API_KEY is required when using RapidAPI-hosted Judge0. ' +
      'Get your API key from https://rapidapi.com/judge0-official/api/judge0-ce'
    );
    err.statusCode = 503; // Service Unavailable
    err.isOperational = true;
    throw err;
  }

  try {
    return await executeWithJudge0(code, language, stdin);
  } catch (error: any) {
    logger.error('Error executing code with Judge0:', error);
    
    // If error already has statusCode, re-throw as-is
    if (error.statusCode && error.isOperational) {
      throw error;
    }
    
    // Otherwise, wrap in a proper error with status code
    const appError: any = new Error(error.message || 'Code execution failed');
    appError.statusCode = error.statusCode || 500;
    appError.isOperational = true;
    throw appError;
  }
};

/**
 * Validate code syntax (basic validation)
 */
export const validateCode = async (
  code: string,
  language: SupportedLanguage
): Promise<{ valid: boolean; errors?: string[] }> => {
  try {
    // For now, we'll do basic validation
    // In production, you might want to use language-specific linters
    
    if (!code || code.trim().length === 0) {
      return { valid: false, errors: ['Code cannot be empty'] };
    }

    // Basic length check
    if (code.length > 100000) {
      return { valid: false, errors: ['Code is too long (max 100KB)'] };
    }

    // Try to execute with a timeout to check for syntax errors
    try {
      await executeCode(code, language);
      return { valid: true };
    } catch (error: any) {
      // If execution fails, it might be a syntax error
      return { valid: false, errors: [error.message] };
    }
  } catch (error: any) {
    logger.error('Error validating code:', error);
    return { valid: false, errors: [error.message] };
  }
};

