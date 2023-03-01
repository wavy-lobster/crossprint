import { createElement, useEffect, useRef } from "react";
import { sendPrintEventAsync, PrinterOptions } from "./printer";
import { PrinterBuilder } from "./printer/PrinterBuilder";
export const print = sendPrintEventAsync;

/**
 * This hook is used to print the content of a ref.
 * Make sure to mount the ref.
 */
export function usePrinter(props: {
  options?: Omit<PrinterOptions, "content">;
  ref?: React.MutableRefObject<HTMLElement | undefined | null>;
}) {
  const { options, ref } = props;

  let builder: PrinterBuilder;
  useEffect(() => {
    if (ref == null) return;
    builder = new PrinterBuilder().fromOptions({
      ...options,
      hidden: true,
      title: options?.title || document.title,
    });
    if (ref.current) builder.content(ref.current);

    /**
     * If you use Next.js or any other meta framework, the styles and fonts aren't loaded by default.
     * You can use the `copyStyles` and `copyFonts` options to copy the styles and fonts to the iframe.
     * It doesn't make any sense, but it works. ¯\_(ツ)_/¯
     */
    builder.build().init({
      copyStyles: true,
      copyFonts: true,
    });
    return () => {
      builder.destroy();
    };
  }, []);
  return {
    print,
    //@ts-ignore
    printer: builder || null,
  } as {
    print: () => void;
    printer: PrinterBuilder | null;
  };
}
/**
 * React component to print the children. It will create a portal to the iframe. And mount the children inside the portal.
 * @todo: Use "createPortal" to mount the children inside the iframe.
 */

export default function PrinterComponent(props: {
  options?: Omit<PrinterOptions, "content">;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { printer } = usePrinter({
    options: props.options,
    ref,
  });
  useEffect(() => {
    printer?.build().init({
      copyStyles: true,
      copyFonts: true,
    });
  }, []);

  return createElement(
    "div",
    {
      ref,
    },
    props.children
  );
}
