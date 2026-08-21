type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

export function logInfo(event: string, context?: LogContext) {
  writeLog('info', event, context);
}

export function logWarn(event: string, context?: LogContext) {
  writeLog('warn', event, context);
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  writeLog('error', event, {
    ...context,
    error: serializeError(error),
  });
}
