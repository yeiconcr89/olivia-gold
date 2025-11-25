/**
 * Logger simple sin dependencias para evitar dependencias circulares
 * Se usa durante la inicialización del sistema antes de que el logger principal esté disponible
 */

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const getCurrentLogLevel = (): number => {
  const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  switch (level) {
    case 'error': return LOG_LEVELS.ERROR;
    case 'warn': return LOG_LEVELS.WARN;
    case 'info': return LOG_LEVELS.INFO;
    case 'debug': return LOG_LEVELS.DEBUG;
    default: return LOG_LEVELS.INFO;
  }
};

const shouldLog = (level: number): boolean => {
  if (process.env.NODE_ENV === 'test') return false;
  return level <= getCurrentLogLevel();
};

const formatMessage = (level: string, message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `${timestamp} [${level}]: ${message}${dataStr}`;
};

export const simpleLogger = {
  error: (message: string, data?: any) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage('ERROR', message, data));
    }
  },
  
  warn: (message: string, data?: any) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage('WARN', message, data));
    }
  },
  
  info: (message: string, data?: any) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.log(formatMessage('INFO', message, data));
    }
  },
  
  debug: (message: string, data?: any) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage('DEBUG', message, data));
    }
  }
};

export default simpleLogger;