import type { Effect, Signal, SignalGetter, Unsubscribable } from './types.js';

let microtaskQueued = false;
let tickPromise = Promise.resolve();
let tickResolve: () => void;
const awaiting = new Set<Set<Effect>>();
const processed = new Set<Effect>();

function notify() {
  for (const set of awaiting) {
    for (const effect of set) {
      if (!processed.has(effect)) {
        effect();
        processed.add(effect);
      }
    }
  }
  awaiting.clear();
  processed.clear();
  microtaskQueued = false;
  tickResolve();
}

const effectStack: [callback: Effect, Set<Unsubscribable>][] = [];

/** @returns A promise that resolves after any pending signal changes have propagated to subscribers. */
export function tick() {
  return tickPromise;
}

/**
 * Creates a reactive signal and initialises it with a value.
 *
 * @example
 *
 * ```js
 * const [count, setCount] = signal(0);
 * ```
 *
 * @param initialValue An initial value for the signal.
 * @param onSubscribe An optional function that runs when number of listeners increases to 1. This
 *   function may optionally return a cleanup function that runs when the number of listeners
 *   decreases to 0.
 * @returns A tuple consisting of a getter and a setter.
 */
export function signal<T>(initialValue: T, onSubscribe?: () => Unsubscribable | void): Signal<T> {
  const subscribers = new Set<Effect>();
  let currentValue = initialValue;
  let cleanup: Unsubscribable | void;
  const get = () => {
    if (effectStack.length) {
      const [callback, unsubscribables] = effectStack[effectStack.length - 1];
      subscribers.add(callback);
      if (onSubscribe && subscribers.size == 1) {
        cleanup = onSubscribe();
      }
      unsubscribables.add(() => {
        subscribers.delete(callback);
        if (cleanup && subscribers.size == 0) {
          cleanup();
          cleanup = undefined;
        }
      });
    }
    return currentValue;
  };
  const set = (newValue: T) => {
    currentValue = newValue;
    awaiting.add(subscribers);
    if (!microtaskQueued) {
      queueMicrotask(notify);
      microtaskQueued = true;
      tickPromise = new Promise((resolve) => (tickResolve = resolve));
    }
  };
  return [get, set];
}

/**
 * Creates a reactive callback. The callback is executed once immediately, then will continue to be
 * re-executed whenever any of the signals it depends on change value. This will continue to happen
 * until unsubscribed.
 *
 * @example
 *
 * ```js
 * const [count] = signal(0);
 *
 * const unsubscribe = effect(() => {
 *   console.log(count());
 * });
 * ```
 *
 * @param callback A callback. Using a signal getter function within the callback will make that
 *   signal a dependency.
 * @returns An unsubscribe function.
 */
export function effect(callback: Effect): Unsubscribable {
  const unsubscribables = new Set<Unsubscribable>();
  effectStack.push([callback, unsubscribables]);
  callback();
  effectStack.pop();
  return () => unsubscribables.forEach((fn) => fn());
}

/**
 * Creates a signal where the value is automatically derived from other signal(s).
 *
 * @example
 *
 * ```js
 * const [count] = signal(0);
 *
 * const doubled = derived(() => {
 *   return count() * 2;
 * });
 * ```
 *
 * @param calculate A callback that computes and returns the value of the derived signal.
 * @returns A getter function.
 */
export function derived<T>(calculate: () => T): SignalGetter<T> {
  const subscribers = new Set<Effect>();
  let currentValue: T;
  let cleanup: Unsubscribable | undefined;
  return () => {
    if (effectStack.length) {
      const [callback, unsubscribables] = effectStack[effectStack.length - 1];
      subscribers.add(callback);
      if (subscribers.size == 1) {
        cleanup = effect(() => {
          const newValue = calculate();
          if (newValue !== currentValue) {
            currentValue = newValue;
          }
          awaiting.add(subscribers);
          if (!microtaskQueued) {
            queueMicrotask(notify);
            microtaskQueued = true;
            tickPromise = new Promise((resolve) => (tickResolve = resolve));
          }
        });
      } else {
        currentValue = calculate();
      }
      unsubscribables.add(() => {
        subscribers.delete(callback);
        if (cleanup && subscribers.size == 0) {
          cleanup();
          cleanup = undefined;
        }
      });
    } else {
      currentValue = calculate();
    }
    return currentValue;
  };
}
