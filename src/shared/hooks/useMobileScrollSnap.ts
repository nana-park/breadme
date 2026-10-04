import { useLayoutEffect, type RefObject } from "react";
import type { OriginalPageId } from "@/config/originalRoutes";
import {
  mobileSnapFlowSelectors,
  mobileSnapSelectors,
} from "@/config/mobileScrollSnap";

/** Annotate existing layout only. Native CSS owns scrolling, touch, wheel,
 * keyboard and history behavior; this hook never intercepts a gesture. */
export function useMobileScrollSnap(
  pageId: OriginalPageId,
  root: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const page = root.current;
    if (!page) return;
    const html = document.documentElement;
    const previousRoot = html.getAttribute("data-mobile-scroll-snap");
    html.setAttribute("data-mobile-scroll-snap", "");
    const previous = new Map<HTMLElement, Map<string, string | null>>();
    const mark = (node: HTMLElement, name: string, value: string) => {
      let values = previous.get(node);
      if (!values) {
        values = new Map();
        previous.set(node, values);
      }
      if (!values.has(name)) values.set(name, node.getAttribute(name));
      node.setAttribute(name, value);
    };
    const refresh = () => {
      page
        .querySelectorAll<HTMLElement>(mobileSnapSelectors[pageId])
        .forEach((node, index) => {
          mark(node, "data-mobile-snap-section", `${pageId}-${index + 1}`);
        });
      const flowSelector = mobileSnapFlowSelectors[pageId];
      if (flowSelector)
        page
          .querySelectorAll<HTMLElement>(flowSelector)
          .forEach((node) => mark(node, "data-mobile-snap-flow", ""));
    };
    refresh();
    // Articles mounts/unmounts a reading region; hidden archive targets are
    // naturally ignored by CSS. Attribute changes do not trigger this observer.
    const observer = new MutationObserver(refresh);
    observer.observe(page, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (previousRoot === null)
        html.removeAttribute("data-mobile-scroll-snap");
      else html.setAttribute("data-mobile-scroll-snap", previousRoot);
      for (const [node, values] of previous)
        for (const [name, value] of values) {
          if (value === null) node.removeAttribute(name);
          else node.setAttribute(name, value);
        }
    };
  }, [pageId, root]);
}
