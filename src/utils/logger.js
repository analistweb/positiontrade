import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logInfo = (message, context = {}) => {
  logger.info({
    message,
    ...context
  });
};

export default logger;