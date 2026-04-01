import { useEffect, useRef, useCallback } from 'react';

/**
 * useInViewFetch
 * ──────────────
 * Attaches an IntersectionObserver to the returned `ref`.
 * Fires `onVisible` exactly ONCE when the element enters the viewport.
 * After firing, the observer disconnects — zero ongoing overhead.
 *
 * @param {() => void} onVisible   Callback to run when element is visible
 * @param {object}     options
 * @param {string}     options.rootMargin   How far before viewport to trigger (default '300px')
 * @param {number}     options.threshold    0–1 intersection ratio needed (default 0)
 * @param {boolean}    options.disabled     If true, observer never attaches (e.g. data already loaded)
 *
 * @returns {{ ref: React.RefObject }}  Attach `ref` to your sentinel element
 *
 * Usage:
 *   const { ref } = useInViewFetch(() => dispatch(fetchSomething()), { disabled: alreadyLoaded });
 *   <div ref={ref} />
 */
const useInViewFetch = (onVisible, { rootMargin = '300px', threshold = 0, disabled = false } = {}) => {
  const ref     = useRef(null);
  const hasFired = useRef(false);

  // Stable callback ref so changing `onVisible` identity doesn't re-run the effect
  const callbackRef = useRef(onVisible);
  useEffect(() => { callbackRef.current = onVisible; }, [onVisible]);

  useEffect(() => {
    // Skip if already fired, explicitly disabled, or element not mounted
    if (disabled || hasFired.current || !ref.current) return;

    // Skip if browser doesn't support IntersectionObserver (very old browsers)
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: fire immediately
      callbackRef.current();
      hasFired.current = true;
      return;
    }

    const el = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          hasFired.current = true;
          callbackRef.current();
          observer.disconnect(); // clean up immediately — no ongoing cost
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    // Cleanup: if component unmounts before firing, disconnect observer
    return () => observer.disconnect();

  // Only re-run if disabled changes (e.g. data got loaded from cache on first render)
  // rootMargin/threshold are stable config values — no need to re-run
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ref };
};

export default useInViewFetch;