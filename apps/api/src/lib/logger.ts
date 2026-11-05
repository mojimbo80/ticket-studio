import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: 'info',
  transport: isProduction ? undefined : { target: 'pino-pretty' },
});
