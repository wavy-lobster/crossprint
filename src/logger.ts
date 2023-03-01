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
  prefix?: string;
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

  get prefix() {
    return (this.options.prefix || "") + ":";
  }
  info(...args: any[]) {
    if (this.#canLog("info")) console.info(this.prefix, ...args);
  }

  warn(...args: any[]) {
    if (this.#canLog("warn")) console.warn(this.prefix, ...args);
  }

  error(...args: any[]) {
    if (this.#canLog("error")) console.error(this.prefix, ...args);
  }

  debug(...args: any[]) {
    if (this.#canLog("debug")) {
      return console.debug(this.prefix, ...args);
    }
  }
}
