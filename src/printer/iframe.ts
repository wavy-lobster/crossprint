import { Logger, LogLevel } from "../logger";

interface IframeOptions {
  id?: string;
  hidden?: boolean;
  copyStyles?: boolean;
  copyFonts?: boolean;
  reuseExistingIframe?: boolean;
}

function createIframeElement(options: { id?: string; hidden?: boolean } = {}) {
  const iframe = document.createElement("iframe");
  if (options?.hidden) {
    iframe.style.display = "none";
    iframe.style.position = "absolute";
  }
  if (options?.id) {
    iframe.id = options.id;
  }
  iframe.style.border = "none";
  iframe.srcdoc = "<!DOCTYPE html>";
  document.body.appendChild(iframe);
  if (iframe.contentDocument) {
    iframe.contentDocument.open();
    iframe.contentDocument.close();
  }
  return iframe;
}

function getIframeElement(id: string) {
  const e = document.getElementById(id);
  if (e?.tagName === "IFRAME") {
    return e as HTMLIFrameElement;
  }
  return null;
}

export class Iframe {
  #iframe = (() => {
    if (this.options.reuseExistingIframe) {
      this.logger?.debug("Trying Reusing existing iframe");
      if (this.options.id) {
        this.logger?.debug(
          "Searching for existing iframe by id",
          this.options.id
        );
        const iframe = getIframeElement(this.options.id);
        if (iframe) {
          this.logger?.debug("Found existing iframe by id", iframe.id);
          return iframe;
        }
      }
    }
    this.logger?.debug("Creating new iframe");
    return createIframeElement(this.options);
  })();
  get element() {
    return this.#iframe;
  }
  private logger = new Logger({
    level: this.logLevel,
    prefix: "Iframe",
  });
  constructor(
    private options: IframeOptions = {},
    private logLevel?: LogLevel
  ) {}

  clearBody() {
    const iframe = this.#iframe.contentWindow?.document;
    if (!iframe) {
      return;
    }
    iframe.body.innerHTML = "";
  }

  clearHead() {
    const iframe = this.#iframe.contentWindow?.document;
    if (!iframe) {
      return;
    }
    iframe.head.innerHTML = "";
  }

  appendStyle(id: string, style: string) {
    const iframeWindow = this.#iframe.contentWindow;
    if (!iframeWindow) {
      return;
    }
    const styleElement = iframeWindow.document.createElement("style");
    styleElement.innerHTML = style;
    styleElement.id = id;
    this.removeStyle(id);
    iframeWindow.document.body.appendChild(styleElement);
  }

  removeStyle(id: string) {
    const iframeWindow = this.#iframe.contentWindow;
    if (!iframeWindow) {
      return;
    }
    const styleElement = iframeWindow.document.getElementById(id);
    if (styleElement) {
      styleElement.remove();
    }
  }

  reset() {
    this.clearHead();
    this.clearBody();
    this.logger?.debug("Iframe has been reset", this.#iframe.id);
  }

  resetAndRemove() {
    this.reset();
    this.#iframe.remove();
    this.logger?.debug("Iframe has been removed", this.#iframe.id);
  }
  copyStylesFromDOM() {
    const styles = Array.from(document.querySelectorAll("style")).concat(
      Array.from(document.querySelectorAll("link[rel=stylesheet]"))
    );
    if (styles.length === 0) {
      this.logger?.info("styles: No styles found; skipping");
      return null;
    }
    this.logger?.debug("Styles: Found", styles.length);
    const iframeHead = this.#iframe.contentWindow?.document.head;
    if (!iframeHead) {
      this.logger?.error("styles: Failed to copy", "Reason: iframe not found");
      return false;
    }

    const failedResults = styles.map(style => {
      try {
        const clone = style.cloneNode(true);
        iframeHead.appendChild(clone);
        return {
          success: true,
          elementId: style.id,
        };
      } catch (e) {
        return {
          success: false,
          elementId: style.id,
          error: e,
        };
      }
    });
    if (failedResults.some(r => r.error)) {
      failedResults
        .filter(r => r.error)
        .forEach(r => {
          this.logger?.error("styles: Failed to copy", r.elementId, r.error);
        });
      this.logger?.error(
        `styles: Failed to copy ${failedResults.length} out of ${styles.length} styles`
      );
      return failedResults;
    }
    return true;
  }
  copyFontsFromDOM() {
    const fonts = window.document.fonts;

    if (!fonts) {
      this.logger?.info("fonts: No fonts found; skipping");
      return null;
    }

    const fontFaces = Array.from(fonts.values());
    const failedResults = fontFaces.map(fontFace => {
      try {
        this.#iframe.contentWindow?.document.fonts.add(fontFace);
        return {
          success: true,
          elementId: fontFace.family,
        };
      } catch (e) {
        return {
          success: false,
          elementId: fontFace.family,
          error: e,
        };
      }
    });
    if (failedResults.some(r => r.error)) {
      return failedResults;
    }
    return true;
  }
  copyContent(element: Element) {
    const iframe = this.#iframe.contentDocument;
    if (!iframe) {
      this.logger?.error(
        "Failed to copy content",
        element,
        "Reason: iframe not found"
      );
      return;
    }
    iframe.body.appendChild(element.cloneNode(true));
    this.logger?.debug("Copied content", element);
  }

  setTitle(title: string) {
    this.#iframe.title = title;
    return true;
  }
}
