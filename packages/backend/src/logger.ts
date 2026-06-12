// Structured JSON logger. FAIL LOUD compliant.
//
// Per principles.md: "A failed turn must be fully reconstructible from logs alone."
// Every event is emitted as one JSON line for grepability.
//
// Levels: debug | info | warn | error | fatal
// - debug: only emitted when LOG_LEVEL=debug
// - info: normal operational events
// - warn: unexpected but non-fatal
// - error: failure surfaces; throws or propagation continue
// - fatal: hard exit. Used after logging unrecoverable state.
//
// FAIL LOUD discipline: this logger NEVER swallows. If JSON.stringify fails,
// the error propagates. There is no fallback log line.

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, data: LogContext): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  });

  if (level === "error" || level === "warn" || level === "fatal") {
    console.error(line);
  } else {
    console.log(line);
  }
}

function serializeError(err: unknown): LogContext {
  if (err instanceof Error) {
    // Some libraries (pg, fetch, photon SDK) attach extra fields to Errors —
    // cast through unknown to safely peek at `code` without a TS narrowing fight.
    const extras = err as unknown as { code?: string };
    return {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...(typeof extras.code === "string" ? { code: extras.code } : {}),
      },
    };
  }
  // Non-Error throws: try JSON-stringify so we don't lose all context to "[object Object]".
  // Falls back to String(err) only if stringify fails (circular refs etc).
  let dump: string;
  try {
    dump = JSON.stringify(err, Object.getOwnPropertyNames(err as object));
  } catch {
    dump = String(err);
  }
  return { error: { value: String(err), dump } };
}

export const log = {
  debug(event: string, data: LogContext = {}): void {
    if (process.env.LOG_LEVEL === "debug") emit("debug", event, data);
  },

  info(event: string, data: LogContext = {}): void {
    emit("info", event, data);
  },

  warn(event: string, data: LogContext = {}): void {
    emit("warn", event, data);
  },

  error(event: string, err: unknown, data: LogContext = {}): void {
    emit("error", event, { ...data, ...serializeError(err) });
  },

  /**
   * Log a fatal error and hard-exit the process.
   * Use only when the process state is unrecoverable.
   */
  fatal(event: string, err: unknown, data: LogContext = {}): never {
    emit("fatal", event, { ...data, ...serializeError(err) });
    process.exit(1);
  },
};
