# [@adamantjs/signals](https://github.com/aidlran/adamant)

A lightweight reactive programming library based on the signals design pattern which has been popularised by many modern frontend JavaScript frameworks.

This implementation ships with both CommonJS and ESM versions and is intended to work in any runtime. The module is is tree-shakable, however using all functions should cost less than 500 bytes in a minified and gzipped bundle.

## Usage

### `signal`

Creates a signal and assigns it an initial value. Returns a tuple consisting of a **getter** and a **setter** which you can name anything you like:

```js
import { signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

console.log(count()); // logged: 1

setCount(2);
console.log(count()); // logged: 2

setCount(count() * 2);
console.log(count()); // logged: 4
```

#### Typed signals

A signal can be of any type. If you use TypeScript, you can specify a type `T` like so:

```ts
import { signal } from '@adamantjs/signals';

type Fruit = 'Apple' | 'Banana' | 'Orange';

const [fruit, setFruit] = signal<Fruit>('Apple');
```

### `effect`

This is where it gets interesting. `effect` creates a **reactive callback**. The callback is executed once immediately. From that point onwards it will be executed again when a value of any of the signals it depends on changes.

```js
import { effect, signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

effect(() => {
  // whenever the value changes, log it
  console.log(count());
});

// increment the count every second
setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

#### Unsubscribing

Our effect will continue to be called **forever**. We need to manually unsubscribe when our effect is no longer needed. The `effect` function returns an unsubscribe function we can use. For instance, you might call this in a component's lifecycle "destroy" or "unmount" hook.

```js
import { effect, signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

const unsubscribe = effect(() => {
  // whenever the count has changed, log it
  console.log(count());
});

// increment the count every second
setInterval(() => {
  setCount(count() + 1);
}, 1000);

// unsubscribe after 5 seconds
setTimeout(() => {
  unsubscribe();
}, 5000);
```

### `derived`

This lets you create a special signal of which the value is derived from other signals. `derived` takes a callback, similar to `effect`, however it expects a return value.

```js
import { derived, effect, signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

const doubled = derived(() => {
  return count() * 2;
});

effect(() => {
  // whenever the derived value has changed, log it
  console.log(doubled());
});

// increment the count every second
setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

If a signal changes its value and no one is around to hear it, does it make a sound? The answer is no! Derived signals will subscribe to their dependencies and re-calculate their value only if they themselves are actively subscribed to.

You can use derived signals to create other derived signals, making them very flexible and powerful. You can create entire computed **signal chains** where values and computations propagate only to where they are subscribed.

```js
import { derived, effect, signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

const doubled = derived(() => {
  return count() * 2;
});

const quadrupled = derived(() => {
  return doubled() * 2;
});

effect(() => {
  console.log(quadrupled());
});

setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

### Timing and `tick`

> [!IMPORTANT]
> To maximize efficiency, effects and derived signals are not recalculated until the call stack completes.

```js
import { effect, signal } from '@adamantjs/signals';

const [count, setCount] = signal(1);

effect(() => {
  // whenever the value changes, log it
  console.log(count());
});

setInterval(() => {
  // this entire call stack will complete before the effect is called
  setCount(count() + 1); // this value is not logged!
  setCount(count() + 1);
}, 1000);
```

Sometimes you need a dependent effect or derived signal to recalculate before you can continue. You can use the `tick` function for this. `tick` will await any pending notifications:

```js
import { effect, signal, tick } from '@adamantjs/signals';

const [count, setCount] = signal(1);

effect(() => {
  // whenever the value changes, log it
  console.log(count());
});

setInterval(async () => {
  setCount(count() + 1);
  await tick(); // now the value is logged
  setCount(count() + 1);
}, 1000);
```

### `signalToStore` (Svelte)

Svelte users with a matching `svelte` peer dependency may use the specialised export `@adamantjs/signals/svelte`. This exposes an additional function `signalToStore` which allows Svelte components to reactively read the signal via `$`.

```svelte
<script>
  import { signal, signaltoStore } from '@adamantjs/signals/svelte';

  const [countSignal, setCount] = signal(0);

  const count = signalToStore(countSignal);
</script>

<button on:click={() => setCount($count + 1)}>{ $count }</button>
```
