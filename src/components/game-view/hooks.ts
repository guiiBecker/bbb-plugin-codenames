import {
  RefCallback, useCallback, useEffect, useRef, useState,
} from 'react';

/**
 * Width of an element, kept up to date. The main area's width has nothing to do with the
 * viewport's (sidebars, presentation split), so the layout follows the element, not media queries.
 */
export const useElementWidth = <T extends HTMLElement>(): [RefCallback<T>, number] => {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(element);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, width];
};
