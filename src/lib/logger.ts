import pino from 'pino';

export const logger = pino({
  name: 'omni-os',
  level: process.env.LOG_LEVEL || 'info'
});
