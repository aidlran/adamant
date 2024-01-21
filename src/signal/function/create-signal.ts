import { queueUniqueMicrotask } from '../../microtask/function/queue-unique-microtask.js';
import type { Subscriber, WritableSignal } from '../types.js';

let effectListener: (() => void) | undefined;

export function createEffect(callback: () => void) {
  effectListener = callback;
  callback();
  effectListener = undefined;
}

export function createSignal<T>(initialValue: T): WritableSignal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<Subscriber<T>>();

  function signal() {
    effectListener && subscribers.add(effectListener);
    return currentValue;
  }

  function push() {
    subscribers.forEach((subscriber) => subscriber(currentValue));
  }

  signal.set = function (newValue: T) {
    currentValue = newValue;
    // TODO: to make even more efficient: notify computed stores first,
    // have them calculate, then notify all subscribers in one pass
    queueUniqueMicrotask(push);
  };

  signal.subscribe = function (subscriber: Subscriber<T>) {
    subscribers.add(subscriber);
    subscriber(currentValue);
    return () => subscribers.delete(subscriber);
  };

  return signal;
}
