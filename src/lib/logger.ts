/**
 * Logging utility with debug mode support
 */

const isDev = import.meta.env.DEV;
const isDebugEnabled = (): boolean => {
  if (isDev) return true;
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('gstcalc-debug') === 'true';
  }
  return false;
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      level,
      timestamp,
      message,
      data: args.length > 0 ? args : undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        if (isDebugEnabled()) {
          console.log(fullMessage, ...args);
        }
        break;
      case 'info':
        console.log(fullMessage, ...args);
        break;
      case 'warn':
        console.warn(fullMessage, ...args);
        break;
      case 'error':
        console.error(fullMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Get recent logs (useful for debugging)
   */
  getLogs(count?: number): LogEntry[] {
    return count ? this.logs.slice(-count) : [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gstcalc-debug', 'true');
      this.info('Debug mode enabled');
    }
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gstcalc-debug');
      this.info('Debug mode disabled');
    }
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return isDebugEnabled();
  }
}

export const logger = new Logger();

// Expose logger to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as { logger: Logger }).logger = logger;
}
