import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : 'info',
  transport: isProduction || isTest ? undefined : { target: 'pino-pretty' },
});
