import pino from 'pino';

/**
 * Enterprise Structured JSON Logger for Vertex Forge Backend
 * Powered by Pino with ISO 8601 UTC timestamps, contextual metadata, and level serialization.
 */
export const serverLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'warn' : 'info'),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'vertex-forge-server',
    env: process.env.NODE_ENV || 'development',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export default serverLogger;
