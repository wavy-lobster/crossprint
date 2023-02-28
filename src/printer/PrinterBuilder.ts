import { Logger, LogLevel } from "../logger.internal";
import { PrinterOptions, PrinterEvents, Printer } from "./index";

export class PrinterBuilder {
  #logger = new Logger();
  get logger() {
    return this.#logger;
  }
  #options: PrinterOptions = {};
  addEvent<K extends PrinterEvents>(
    event: K,
    listener: (this: Window, ev: Event) => any
  ): PrinterBuilder {
    if (!this.#options.events) {
      this.#options.events = {};
    }
    this.#options.events[event] = listener;
    return this;
  }
  setEvents(events: PrinterOptions["events"]): PrinterBuilder {
    this.#options.events = events;
    return this;
  }

  content(element?: HTMLElement): PrinterBuilder {
    this.#options.content = element;
    return this;
  }

  loggerLevel(level?: LogLevel): PrinterBuilder {
    if (level) this.#logger.level = level;
    return this;
  }

  title(title?: string): PrinterBuilder {
    this.#options.title = title;
    return this;
  }

  pageStyle(style?: string): PrinterBuilder {
    this.#options.pageStyle = style;
    return this;
  }
  #buildedPrinter: Printer | null = null;
  build(): Printer {
    this.#buildedPrinter = new Printer(this.#options, this.#logger);
    return this.#buildedPrinter;
  }
  getBuildedPrinter() {
    return this.#buildedPrinter;
  }

  fromOptions(opts: PrinterOptions) {
    this.#options = opts;
    if (opts.logLevel) this.#logger.level = opts.logLevel;
    return this;
  }

  destroy() {
    this.#buildedPrinter?.remove();

    this.#buildedPrinter = null;
    this.#logger.debug("Destroyed printer");
  }
}
