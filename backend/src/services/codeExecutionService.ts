import axios from 'axios';
import logger from '../utils/logger';
import { SupportedLanguage } from '../models/CodeSnippet';

// Judge0 API configuration (free tier available)
// Alternative: Piston API (open source, self-hostable)
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const USE_JUDGE0 = !!JUDGE0_API_KEY;

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
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: {
          base64_encoded: 'false',
          wait: 'true', // Wait for execution to complete
        },
      }
    );

    const token = submitResponse.data.token;

    // Get execution result
    const resultResponse = await axios.get(
      `${JUDGE0_API_URL}/submissions/${token}`,
      {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: {
          base64_encoded: 'false',
        },
      }
    );

    const result = resultResponse.data;

    // Map Judge0 status to our status
    let status: CodeExecutionResult['status'] = 'success';
    if (result.status.id === 3) {
      // Accepted
      status = 'success';
    } else if (result.status.id === 4 || result.status.id === 5) {
      // Wrong Answer or Time Limit Exceeded
      status = 'error';
    } else if (result.status.id === 6) {
      // Compilation Error
      status = 'error';
    } else if (result.status.id === 7 || result.status.id === 8) {
      // Runtime Error
      status = 'runtime_error';
    } else if (result.status.id === 9) {
      // Runtime Error (NZEC)
      status = 'runtime_error';
    }

    return {
      output: result.stdout || undefined,
      error: result.stderr || result.compile_output || undefined,
      executionTime: result.time ? parseFloat(result.time) * 1000 : undefined, // Convert to milliseconds
      memoryUsed: result.memory ? result.memory * 1024 : undefined, // Convert to bytes
      status,
    };
  } catch (error: any) {
    logger.error('Error executing code with Judge0:', error);
    throw new Error(`Code execution failed: ${error.message}`);
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

    const response = await axios.post(`${PISTON_API_URL}/execute`, {
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
    });

    const result = response.data;

    let status: CodeExecutionResult['status'] = 'success';
    if (result.run.code !== 0) {
      status = 'runtime_error';
    }

    return {
      output: result.run.stdout || undefined,
      error: result.run.stderr || result.compile?.stderr || undefined,
      executionTime: result.run.output ? undefined : undefined, // Piston doesn't provide execution time
      memoryUsed: undefined, // Piston doesn't provide memory usage
      status,
    };
  } catch (error: any) {
    logger.error('Error executing code with Piston:', error);
    throw new Error(`Code execution failed: ${error.message}`);
  }
};

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
  try {
    // Use Judge0 if available, otherwise fall back to Piston
    if (USE_JUDGE0) {
      return await executeWithJudge0(code, language, stdin);
    } else {
      return await executeWithPiston(code, language, stdin);
    }
  } catch (error: any) {
    logger.error('Error executing code:', error);
    throw error;
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

