import pino from 'pino'

export const createLogger = (service: string) =>
    pino({
        name: service,
        level: process.env.LOG_LEVEL ?? 'info',
        formatters: {
            level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    })

export type Logger = ReturnType<typeof createLogger>