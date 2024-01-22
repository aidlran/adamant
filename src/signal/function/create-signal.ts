import type { Effect, Signal, Unsubscribable } from '../types.js';

// TODO: to make even more efficient: notify derived signals first,
// have them calculate, then notify all end subscribers in one pass

let microtaskQueued = false;
const awaitingNotify = new Set<Set<Effect>>();

function notifySubscribers() {
  for (const set of awaitingNotify) {
    for (const effect of set) {
      effect();
    }
  }
  awaitingNotify.clear();
  microtaskQueued = false;
}

let effectCallback: Effect | undefined;
let effectUnsubscribeSet: Set<Unsubscribable> | undefined;

/**
 * Creates a reactive callback. The callback is executed once immediately, then will continue to be
 * re-executed whenever any of the signals it depends on change value. This will continue to happen
 * until unsubscribed.
 *
 * @example
 *
 * ```js
 * const [count] = createSignal(0);
 *
 * const unsubscribe = createEffect(() => {
 *   console.log(count());
 * });
 * ```
 *
 * @param callback A callback. Using `SignalGetter` functions within the callback will mean the
 *   corresponding signal becomes a dependency.
 * @returns An unsubscribe function.
 */
export function createEffect(callback: Effect): Unsubscribable {
  effectCallback = callback;
  effectUnsubscribeSet = new Set();
  callback();
  const unsubscribe = function (this: Set<Effect>) {
    this.forEach((fn) => fn());
  }.bind(effectUnsubscribeSet);
  effectCallback = effectUnsubscribeSet = undefined;
  return unsubscribe;
}

/**
 * Creates a reactive signal and initialises it with a value.
 *
 * @example
 *
 * ```js
 * const [count, setCount] = createSignal(0);
 * ```
 *
 * @param initialValue An initial value for the signal.
 * @returns A tuple consisting of a `SignalGetter` and a `SignalSetter`.
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<Effect>();

  function get() {
    if (effectCallback) {
      subscribers.add(effectCallback);
      effectUnsubscribeSet!.add(
        function (this: Effect) {
          subscribers.delete(this);
        }.bind(effectCallback),
      );
    }
    return currentValue;
  }

  function set(newValue: T) {
    currentValue = newValue;
    awaitingNotify.add(subscribers);
    if (!microtaskQueued) {
      queueMicrotask(notifySubscribers);
      microtaskQueued = true;
    }
  }

  return [get, set];
}
