import { Logger } from "../logger.internal";

interface IframeOptions {
  id?: string;
  hidden?: boolean;
  copyStyles?: boolean;
  copyFonts?: boolean;
  logger?: Logger;
  reuseExisting?: boolean;
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
  document.body.appendChild(iframe);
  return iframe;
}

function getIframeElement(id: string) {
  const e = document.getElementById(id);
  if (e?.tagName === "IFRAME") {
    return e as HTMLIFrameElement;
  }
  return null;
}

// const initialIframeContent = /*html*/ `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="utf-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <title>Iframe</title>
//       </head>
//       <body></body>
//     </html>
//   `;

function createOrGetIframe(options: IframeOptions = {}) {
  if (options.reuseExisting) {
    options.logger?.debug("Trying Reusing existing iframe");
    if (options.id) {
      options.logger?.debug("Searching for existing iframe by id", options.id);
      const iframe = getIframeElement(options.id);
      if (iframe) {
        options.logger?.debug("Found existing iframe by id", iframe.id);
        return iframe;
      }
    }
  }
  options.logger?.debug("Creating new iframe");
  return createIframeElement(options);
}

function copyStyles(iframe: HTMLIFrameElement, options?: { logger?: Logger }) {
  const styles = Array.from(document.querySelectorAll("style")).concat(
    Array.from(document.querySelectorAll("link[rel=stylesheet]"))
  );
  options?.logger?.debug("Copying styles", styles);
  const iframeHead = iframe.contentWindow?.document.head;
  if (!iframeHead) {
    return false;
  }

  options?.logger?.debug("Target iframe head", iframeHead);
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
    options?.logger?.error("Failed to copy styles", failedResults);
    return failedResults;
  }
  return true;
}

function copyFonts(iframe: HTMLIFrameElement) {
  const fonts = window.document.fonts;

  if (!fonts) {
    return null;
  }

  const fontFaces = Array.from(fonts.values());

  const failedResults = fontFaces.map(fontFace => {
    try {
      iframe.contentWindow?.document.fonts.add(fontFace);
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

function createIframe(options: IframeOptions = {}) {
  const iframe = createOrGetIframe(options);
  if (options.copyStyles) {
    const r = copyStyles(iframe);
    if (r !== true) {
      options.logger?.error("Failed to copy styles", r);
    }
  }
  if (options.copyFonts) {
    const r = copyFonts(iframe);
    if (r !== true) {
      options.logger?.error("Failed to copy fonts", r);
    }
  }
  // iframe.contentWindow?.document.write(initialIframeContent);
  return iframe;
}

export class Iframe {
  #iframe = createIframe(this.options);
  get element() {
    return this.#iframe;
  }
  constructor(private options: IframeOptions = {}) {}

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
    // this.#iframe.contentWindow?.document.write(initialIframeContent);
  }

  resetAndRemove() {
    this.reset();
    this.#iframe.remove();
  }
  copyStylesFromDOM() {
    return copyStyles(this.#iframe);
  }
  copyFontsFromDOM() {
    return copyFonts(this.#iframe);
  }
  copyContent(element: Element) {
    const iframe = this.#iframe.contentWindow?.document;
    if (!iframe) {
      return;
    }
    iframe.body.innerHTML = "";
    iframe.body.appendChild(element.cloneNode(true));
  }

  setTitle(title: string) {
    const iframe = this.#iframe.contentWindow?.document;
    if (!iframe) {
      return false;
    }
    iframe.title = title;
    return true;
  }
}
