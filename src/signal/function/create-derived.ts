import type { ReadableSignal } from '../types.js';
import { createEffect, createSignal } from './create-signal.js';
import { toReadOnlySignal } from './to-read-only-signal.js';

/**
 * Creates a derived signal, which is a special `ReadableSignal` where the value is automatically
 * derived from other signal(s).
 *
 * @param callback A callback, called whenever the signal needs re-calculating, that returns the
 *   calculated value of the derived signal.
 */
export function createDerived<T>(callback: () => T): ReadableSignal<T> {
  const signal = createSignal(callback());

  createEffect(() => {
    const newValue = callback();
    if (signal() !== newValue) {
      signal.set(newValue);
    }
  });

  return toReadOnlySignal(signal);

  /**
   * TODO: to make more efficient, while no one is listening, don't compute and unsubscribe from
   * dependencies.
   */
}
