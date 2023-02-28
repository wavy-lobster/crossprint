import React, { useEffect, useRef } from "react";
import { createElement } from "react";
import { sendPrintSignal, PrinterOptions } from "./printer";
import { PrinterBuilder } from "./printer/PrinterBuilder";

/**

 * @example <caption>With direct content</caption>
 * import { PrinterComponent } from "crossprint";
 * import { useRef } from "react";
 * export function App() {
 *      const ref = useRef<HTMLElement>();
 *   const printer = PrinterComponent({
 *       content: ref.current,
 *   });
 *   return (
 *       <>
 *           <div ref={ref}>
 *               <div>test</div>
 *               // Your content here
 *               //
 *           </div>
 *           <button onClick={printer?.print}>Print</button>
 *       </>
 * }
 */

export const print = () => {
  void sendPrintSignal();
};
/**
 *   @example <caption>With children</caption>
 * import PrinterComponent, { print } from "crossprint";
 *
 * export default function App() {
 *  return (
 *   <PrinterComponent title="test" pageStyle="body { background-color: red }">
 *    <div>test</div>
 *    <MuiButton onClick={print}>Print</MuiButton>
 *  </PrinterComponent>
 *  );
 * }
 *
 */
export function usePrinter(props: {
  options?: PrinterOptions;
  ref?: React.MutableRefObject<HTMLElement | undefined | null>;
}) {
  const { options, ref } = props;

  let builder: PrinterBuilder;
  useEffect(() => {
    if (!ref?.current) return;
    builder = new PrinterBuilder().fromOptions({
      ...options,
      content: ref.current,
      // We need to mount all elements before copying them to the iframe
      copyFonts: false,
      copyStyles: false,
      hidden: true,
      title: options?.title || document.title,
    });
    builder.build().init({
      copyStyles: true,
      copyFonts: true,
    });
    return () => {
      builder.destroy();
    };
  }, []);
  return print;
}

export default function PrinterComponent(props: {
  options?: PrinterOptions;
  children?: React.ReactNode;
}) {
  const { options, children } = props;
  const ref = useRef<HTMLElement>();
  usePrinter({ options, ref });
  return createElement(
    "div",
    {
      ref,
    },
    children
  );
}
