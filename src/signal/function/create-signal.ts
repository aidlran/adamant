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
