import logger from './logger';

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End timing and log the duration
   */
  static end(label: string, log: boolean = true): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`No timer found for label: ${label}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    if (log && duration > 1000) {
      logger.warn(`Slow operation detected: ${label} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Measure async function execution time
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
    log: boolean = true
  ): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label, log);
      return result;
    } catch (error) {
      this.end(label, log);
      throw error;
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Batch database operations
 */
export async function batchOperation<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }

  return results;
}

