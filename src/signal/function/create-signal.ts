import { queueUniqueMicrotask } from '../../microtask/function/queue-unique-microtask.js';
import type { Effect, Signal, Unsubscribable } from '../types.js';

let effectCallback: Effect | undefined;
let effectUnsubscribeSet: Set<Effect> | undefined;

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

  function unsubscribe(this: Effect) {
    subscribers.delete(this);
  }

  function get() {
    if (effectCallback) {
      subscribers.add(effectCallback);
      effectUnsubscribeSet!.add(unsubscribe.bind(effectCallback));
    }
    return currentValue;
  }

  function push() {
    subscribers.forEach((fn) => fn());
  }

  function set(newValue: T) {
    currentValue = newValue;
    // TODO: to make even more efficient: notify computed stores first,
    // have them calculate, then notify all subscribers in one pass
    queueUniqueMicrotask(push);
  }

  return [get, set];
}
