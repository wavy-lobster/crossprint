import { Logger, LogLevel } from "../logger";
import { Iframe } from "./iframe";

export type PrinterEvents = keyof WindowEventMap;

export interface PrinterOptions {
  events?: {
    [key in PrinterEvents]?: (this: Window, ev: Event) => any;
  };
  hidden?: boolean;
  content?: HTMLElement;
  title?: string;
  pageStyle?: string;
  copyStyles?: boolean;
  copyFonts?: boolean;
  logLevel?: LogLevel;
  reuseExistingIframe?: boolean;
}

export class Printer {
  /**
   * This is the id of the Signal that is sent to the iframe
   */

  static readonly iframeId = `crossprint-iframe-${0xdefaced}` as const;
  static readonly printEventId = `crossprint-signal-${0xd00dfeed}` as const;

  #iframe = new Iframe(
    {
      reuseExistingIframe: this.options.reuseExistingIframe,
      hidden: this.options.hidden,
      id: Printer.iframeId,
    },
    this.options.logLevel
  );
  get iframe() {
    return this.#iframe;
  }
  private logger = new Logger({
    level: this.options.logLevel,
    prefix: "Printer",
  });
  constructor(private options: PrinterOptions) {}

  #registerEvents() {
    if (this.options.events) {
      Object.entries(this.options.events).forEach(([key, value]) => {
        this.#iframe.element.addEventListener(key as any, value);
      });
      this.logger?.debug("Registered events", this.options.events);
    }

    window.addEventListener(
      Printer.printEventId as any,
      this.#handlePrintSignal.bind(this)
    );
    this.logger?.debug("Registered print signal event");
  }

  #unregisterEvents() {
    if (this.options.events) {
      Object.entries(this.options.events).forEach(([key, value]) => {
        window.removeEventListener(key as any, value);
      });
      this.logger?.debug("Unregistered events", this.options.events);
    }

    window.removeEventListener(
      Printer.printEventId as any,
      this.#handlePrintSignal.bind(this)
    );
  }

  #handlePrintSignal = (e: Event) => {
    this.logger?.debug("Received print signal", e);
    this.print();
  };

  #ready = false;
  get isReady() {
    return this.#ready;
  }
  init(options?: { copyStyles?: boolean; copyFonts?: boolean }) {
    if (!this.options.content) {
      this.logger?.warn("tried to make printable without content");
    }
    if (this.#ready) {
      this.logger?.warn("tried to make printable twice");
      return;
    }
    this.#registerEvents();
    if (options?.copyStyles) {
      const r = this.#iframe.copyStylesFromDOM();
      if (r !== true) {
        this.logger?.error("Failed to copy styles", r);
      }
    }
    if (options?.copyFonts) {
      const r = this.#iframe.copyFontsFromDOM();
      if (r !== true) {
        this.logger?.error("Failed to copy fonts", r);
      }
    }
    if (this.options.pageStyle) {
      this.#iframe.appendStyle("page-style", this.options.pageStyle);
    }

    if (this.options.title) {
      this.#iframe.setTitle(this.options.title);
    }
    if (this.options.content) {
      this.#iframe.copyContent(this.options.content);
    }
    this.#ready = true;
  }

  reset() {
    this.#unregisterEvents();
    this.#iframe.reset();
    this.#ready = false;
    this.logger?.debug("Printer: Reset");
  }
  remove() {
    this.#unregisterEvents();
    this.#iframe.element.remove();
    this.#ready = false;
    this.logger?.debug("Removed iframe");
  }
  print() {
    if (!this.#ready) {
      this.logger?.warn("tried to print before making printable");
      return;
    }
    // Workaround for Chrome; It ignores the title in the iframe, so we have to set document.title of the parent window temporarily
    const oldDocumentTitle = document.title;
    try {
      if (this.options.title) {
        document.title = this.options.title;
      }
      this.logger?.debug(
        "Printing",
        this.#iframe.element,
        this.options.content
      );
      //@ts-expect-error
      this.#iframe.element.contentWindow.print();
      document.title = oldDocumentTitle;
    } catch (error) {
      document.title = oldDocumentTitle;
      this.logger?.error("Error while printing", error);
    }
  }
  setTitle(title: string) {
    if (!this.#iframe.setTitle(title)) {
      this.logger?.warn("Something went wrong while setting the title");
      return;
    }
    this.options.title = title;
  }
}
/**
 * This is the id of the Event that is sent to the iframe to print
 */
export const printEventId = Printer.printEventId;
/**
 * Sends an event to the iframe to print asynchronously
 *
 * Intended to be used in a click handler.
 *
 * **Note:** Return does not indicate if the event was handled successfully
 * @returns true if the event was sent successfully
 * @returns false if the event was not sent successfully
 * @see sendPrintEvent
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sendPrintEventAsync() {
  return sendPrintEvent();
}
/**
 * Sends an event to the iframe to print
 *
 * **Note:** Return does not indicate if the event was handled successfully
 *
 * @returns true if the event was sent successfully
 * @returns false if the event was not sent successfully
 */
export function sendPrintEvent() {
  return window.dispatchEvent(new Event(printEventId));
}
