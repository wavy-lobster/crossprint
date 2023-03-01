# Crossprint

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Easily print HTML elements or components to PDF.

Uses under the hood window.print() and the browser's print dialog.

> The problem with print individual elements is that the browser will print the whole page, not just the element.
>
> You cloud use CSS to hide the unwanted elements, but this is not a good solution because you will have to hide the elements every time you want to print. Which my be a headache if you have a lot of elements.
>
> You could also use `iframe` (which this library uses), but you would have platform issues like Chrome not saving the PDF file name.
>
> Or in my case with nextjs, it doesn't load the stylesheets.
>
> This library solves all of these problems by using the browser's print dialog and the `iframe` element.

## Install

```bash
npm install crossprint
```

## Examples

There currently are two ways to use this library.

Other frameworks are not supported yet, but you can use the `PrinterBuilder` class to create your own implementation.

if you have a working implementation, please open a PR to add it to the list.

### Vanilla JS (TS)

```ts
import { PrinterBuilder, sendPrintEvent } from 'crossprint';
const element = document.getElementById('root');
const builder = new PrinterBuilder().fromOptions({
  content: element as HTMLDivElement,
  copyFonts: true,
  copyStyles: true,
  title: 'My Title',
});
/**
 * Call init() to copy the content, styles and fonts to the iframe.
 */
builder.build().init();

// to print the content
sendPrintEvent();
```

### React

With a hook

```tsx
import React from 'react';
import { usePrinter } from 'crossprint/react';

export default function App() {
  const ref = useRef<HTMLDivElement>(null);
  const { print } = usePrinter({
    ref,
    options: {
      title: 'test',
    },
  });
  return (
    <>
      <div ref={ref}>
        <p> Hello World </p>
      </div>
      <button onClick={print}>Print</button>
    </>
  );
}
```

As a component

```tsx
import React from 'react';
import PrinterComponent, { print } from 'crossprint/lib/react';

export default function App() {
  return (
    <>
      <PrinterComponent>
        <p> Hello World </p>
      </PrinterComponent>
      <button onClick={print}>Print</button>
    </>
  );
}
```

## API

### Workflow of the library

import { PrinterBuilder, sendPrintEvent, sendPrintEventAsync } from 'crossprint';

1. Create a `PrinterBuilder` instance
2. You can add options to the builder
   - `content` - the content to print
   - `copyStyles` - copy the stylesheets to the iframe directly, this is useful if the stylesheets are preloaded. (default: `false`)
   - `copyFonts` - copy the fonts to the iframe directly, this is useful if the fonts are preloaded. (default: `false`)
   - `title` - the title of the document
   - `pageStyle` - the style of the page
   - `logLevel` - the log level of the library. (default: `none`)
     - options: `none`, `error`, `warn`, `info`, `debug`
   - `reuseExistingIframe` - reuse the existing iframe if it exists. (default: `true`)
3. Call `build()` to create and return a `Printer` instance.
   - if you want to reuse the same `Printer` instance, you can call `getBuildedPrinter()` on the builder.
4. Call `init()` on the `Printer` instance to copy the content, styles and fonts to the iframe.
5. Call `sendPrintEvent()` or `sendPrintEventAsync()` to print the content.
6. alternatively, you can call `print()` on the `Printer` instance to print the content.

## Known incompatibilities

- `Firefox for Android` - doesn't support `print()` and `window.print()`. (see [here](https://developer.mozilla.org/en-US/docs/Web/API/Window/print#browser_compatibility))

[build-img]: https://github.com/wavy-lobster/crossprint/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/wavy-lobster/crossprint/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/crossprint
[downloads-url]: https://www.npmtrends.com/crossprint
[npm-img]: https://img.shields.io/npm/v/crossprint
[npm-url]: https://www.npmjs.com/package/crossprint
[issues-img]: https://img.shields.io/github/issues/wavy-lobster/crossprint
[issues-url]: https://github.com/wavy-lobster/crossprint/issues
