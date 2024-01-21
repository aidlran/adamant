import { queueUniqueMicrotask } from '../../microtask/function/queue-unique-microtask.js';
import type { Subscriber, WritableSignal } from '../types.js';

let effectListener: (() => void) | undefined;
let effectUnsubscribeSet: Set<() => void> | undefined;

export function createEffect(callback: () => void) {
  effectListener = callback;
  effectUnsubscribeSet = new Set();
  callback();
  const unsubscribe = function (this: Set<() => void>) {
    this.forEach((fn) => fn());
  }.bind(effectUnsubscribeSet);
  effectListener = effectUnsubscribeSet = undefined;
  return unsubscribe;
}

export function createSignal<T>(initialValue: T): WritableSignal<T> {
  let currentValue = initialValue;
  const subscribers = new Set<Subscriber<T> | (() => void)>();

  function unsubscribe(this: Subscriber<T> | (() => void)) {
    subscribers.delete(this);
  }

  function signal() {
    if (effectListener) {
      subscribers.add(effectListener);
      effectUnsubscribeSet!.add(unsubscribe.bind(effectListener));
    }
    return currentValue;
  }

  function push() {
    subscribers.forEach((subscriber) => subscriber(currentValue));
  }

  signal.set = (newValue: T) => {
    currentValue = newValue;
    // TODO: to make even more efficient: notify computed stores first,
    // have them calculate, then notify all subscribers in one pass
    queueUniqueMicrotask(push);
  };

  signal.subscribe = (subscriber: Subscriber<T>) => {
    subscribers.add(subscriber);
    subscriber(currentValue);
    return unsubscribe.bind(subscriber);
  };

  return signal;
}
