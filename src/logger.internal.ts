const levels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
} as const;
export type LogLevel = keyof typeof levels;
interface LoggerOptions {
  verbose?: boolean;
  level?: LogLevel;
}

export class Logger {
  constructor(private options: LoggerOptions = {}) {}
  set level(level: LogLevel) {
    this.options.level = level;
  }
  get level() {
    return this.options.level || "none";
  }
  #canLog(level: LogLevel) {
    if (!this.options.level) return false;
    if (this.options.verbose) return true;
    return levels[level] <= levels[this.options.level];
  }

  info(...args: any[]) {
    if (this.#canLog("info")) console.info(...args);
  }

  warn(...args: any[]) {
    if (this.#canLog("warn")) console.warn(...args);
  }

  error(...args: any[]) {
    if (this.#canLog("error")) console.error(...args);
  }

  debug(...args: any[]) {
    if (this.#canLog("debug")) console.debug(...args);
  }
}
