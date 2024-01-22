import type { SignalGetter } from '../types.js';
import { createEffect, createSignal } from './create-signal.js';

// TODO: to make more efficient, while no one is listening, don't compute and unsubscribe from
// dependencies.

/**
 * Creates a signal where the value is automatically derived from other signal(s).
 *
 * @example
 *
 * ```js
 * const [count] = createSignal(0);
 *
 * const doubled = createDerived(() => {
 *   return count() * 2;
 * });
 * ```
 *
 * @param callback A callback that computes and returns the value of the derived signal.
 * @returns A `SignalGetter` function.
 */
export function createDerived<T>(callback: () => T): SignalGetter<T> {
  const [get, set] = createSignal(undefined as T);

  createEffect(() => {
    const newValue = callback();
    if (get() !== newValue) {
      set(newValue);
    }
  });

  return get;
}
