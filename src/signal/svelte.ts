export * from './index.js';

import { Readable, readable } from 'svelte/store';
import { createEffect, type SignalGetter } from './index.js';

export function signalToStore<T>(signal: SignalGetter<T>): Readable<T> {
  return readable(signal(), (update) => createEffect(() => update(signal())));
}
