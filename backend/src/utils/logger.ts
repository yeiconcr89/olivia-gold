import winston from 'winston';

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Configuración del logger sin dependencias de config para evitar dependencias circulares
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'debug' : 'info');
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'joyeria-elegante-api' },
  transports: [
    // Escribir logs de error a archivo
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Escribir todos los logs a archivo
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En desarrollo, también mostrar logs en consola
if (isDevelopment) {
  logger.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Función helper para logs estructurados
export const logRequest = (req: any, res: any, duration: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
};