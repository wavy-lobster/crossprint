/* eslint-disable */
import { Logger, LogLevel } from '../logger.internal';
import { Iframe } from './iframe.internal';

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
  reuseExisting?: boolean;
}

export class Printer {
  /**
   * This is the id of the Signal that is sent to the iframe
   */

  static readonly iframeId = `crossprint-iframe-${0xdefaced}` as const;
  static readonly printSignalId = `crossprint-signal-${0xd00dfeed}` as const;

  #iframe = new Iframe({
    reuseExisting: this.options.reuseExisting,
    logger: this.logger,
    hidden: this.options.hidden,
    id: Printer.iframeId,
  });
  get iframe() {
    return this.#iframe;
  }
  constructor(private options: PrinterOptions, private logger?: Logger) {}

  #registerEvents() {
    if (this.options.events) {
      Object.entries(this.options.events).forEach(([key, value]) => {
        this.#iframe.element.addEventListener(key as any, value);
      });
      this.logger?.debug('Registered events', this.options.events);
    }

    window.addEventListener(
      Printer.printSignalId as any,
      this.#handlePrintSignal.bind(this)
    );
    this.logger?.debug('Registered print signal event');
  }

  #unregisterEvents() {
    if (this.options.events) {
      Object.entries(this.options.events).forEach(([key, value]) => {
        window.removeEventListener(key as any, value);
      });
      this.logger?.debug('Unregistered events', this.options.events);
    }

    window.removeEventListener(
      Printer.printSignalId as any,
      this.#handlePrintSignal.bind(this)
    );
  }

  #handlePrintSignal = (e: Event) => {
    this.logger?.debug('Received print signal', e);
    this.print();
  };

  #ready = false;
  get isReady() {
    return this.#ready;
  }
  init(options?: { copyStyles?: boolean; copyFonts?: boolean }) {
    if (!this.options.content) {
      this.logger?.error('tried to make printable without content');
      return;
    }
    if (this.#ready) {
      this.logger?.warn('tried to make printable twice');
      return;
    }
    this.#registerEvents();
    if (options?.copyStyles) {
      let r = this.#iframe.copyStylesFromDOM();
      if (r !== true) {
        this.logger?.error('Failed to copy styles', r);
      }
    }
    if (options?.copyFonts) {
      let r = this.#iframe.copyFontsFromDOM();
      if (r !== true) {
        this.logger?.error('Failed to copy fonts', r);
      }
    }
    if (this.options.pageStyle) {
      this.#iframe.appendStyle('page-style', this.options.pageStyle);
    }

    if (this.options.title) {
      this.#iframe.setTitle(this.options.title);
    }
    this.#iframe.copyContent(this.options.content);
    this.#ready = true;
  }

  reset() {
    this.#unregisterEvents();
    this.#iframe.reset();
    this.#ready = false;
  }
  remove() {
    this.#unregisterEvents();
    this.#iframe.element.remove();
    this.#ready = false;
  }
  print() {
    if (!this.#ready) {
      this.logger?.warn('tried to print before making printable');
      return;
    }
    // Workaround for Chrome; It ignores the title in the iframe, so we have to set document.title of the parent window
    const oldDocumentTitle = document.title;
    try {
      if (this.options.title) {
        document.title = this.options.title;
      }
      //@ts-expect-error
      this.#iframe.element.contentWindow.print();
      document.title = oldDocumentTitle;
    } catch (error) {
      document.title = oldDocumentTitle;
      this.logger?.error('Error while printing', error);
    }
  }
  setTitle(title: string) {
    if (!this.#iframe.setTitle(title)) {
      this.logger?.warn('Something went wrong while setting the title');
      return;
    }
    this.options.title = title;
  }
}

export const printSignalId = Printer.printSignalId;

export const sendPrintSignal = async () => {
  window.dispatchEvent(new Event(printSignalId));
};
