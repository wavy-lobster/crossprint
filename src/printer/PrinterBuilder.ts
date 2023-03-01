import { PrinterOptions, PrinterEvents, Printer } from ".";
import type { LogLevel } from "../logger";

export class PrinterBuilder {
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
    if (level) this.#options.logLevel = level;
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
    this.#buildedPrinter = new Printer(this.#options);
    return this.#buildedPrinter;
  }
  getBuildedPrinter() {
    return this.#buildedPrinter;
  }

  fromOptions(opts?: PrinterOptions) {
    if (opts) this.#options = opts;
    return this;
  }

  destroy() {
    this.#buildedPrinter?.remove();
    this.#buildedPrinter = null;
  }
}
