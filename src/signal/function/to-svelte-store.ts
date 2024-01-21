import { Readable, readable } from 'svelte/store';
import { SignalGetter } from '../types.js';
import { createEffect } from './create-signal.js';

export function signalToStore<T>(signal: SignalGetter<T>): Readable<T> {
  return readable(signal(), (update) => createEffect(() => update(signal())));
}
