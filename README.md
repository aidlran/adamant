# [@adamantjs/signals](https://github.com/aidlran/adamant)

A lightweight and highly compatible implementation of the signals design pattern, which was popularised by [SolidJS](https://www.solidjs.com/tutorial/introduction_signals) and now appears in many frontend JavaScript frameworks.

This implementation is designed to work in **any** runtime and ships with both CommonJS and ESM versions! Minified and gzipped, it comes to just ~325 bytes.

This library has been built to power [LibreBase](https://github.com/aidlran/librebase).

## Usage

### `createSignal`

Creates a signal and assigns it an initial value. Returns a tuple consisting of a **getter** and a **setter** which you can name anything you like:

```js
import { createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

console.log(count()); // logged: 1

setCount(2);
console.log(count()); // logged: 2

setCount(count() * 2);
console.log(count()); // logged: 4
```

#### Typed signals

A signal can be of any type. If you use TypeScript, you can specify a type `T` like so:

```ts
import { createSignal } from '@adamantjs/signals';

type Fruit = 'Apple' | 'Banana' | 'Orange';

const [fruit, setFruit] = createSignal<Fruit>('Apple');
```

### `createEffect`

This is where it gets interesting. `createEffect` creates a **reactive callback**. The callback is executed once immediately. From that point onwards it will be executed again when a value of any of the signals it depends on changes.

```js
import { createEffect, createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

createEffect(() => {
  // whenever the value changes, log it
  console.log(count());
});

// increment the count every second
setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

#### Timing

> [!IMPORTANT]
> To optimise execution at runtime, listeners are not notified until the call stack is exhausted and signal values are settled. This makes signals great for creating fast and reactive user interfaces, but might not be suitable for all applications!

```js
import { createEffect, createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

createEffect(() => {
  // whenever the value changes, log it
  console.log(count());
});

setInterval(() => {
  // this entire call stack will complete before the effect is called
  setCount(count() + 1); // this value is not logged!
  setCount(count() + 1);
}, 1000);
```

#### Unsubscribing

Our effect will continue to be called **forever**. We need to manually unsubscribe when our effect is no longer needed. The `createEffect` function returns an unsubscribe function we can use. For instance, you might call this in a component's lifecycle "destroy" or "unmount" hook.

```js
import { createEffect, createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

const unsubscribe = createEffect(() => {
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

### `createDerived`

This lets you create a special signal of which the value is derived from other signals. `createDerived` takes a callback, similar to `createEffect`, however it expects a return value.

```js
import { createDerived, createEffect, createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

const doubled = createDerived(() => {
  return count() * 2;
});

createEffect(() => {
  // whenever the derived value has changed, log it
  console.log(doubled());
});

// increment the count every second
setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

<!-- TODO: this isn't implemented yet! -->
<!-- If a signal changes its value and no one is around to hear it, does it make a sound? The answer is no! Derived signals will subscribe to their dependencies and re-calculate their value only if they themselves are actively subscribed to. -->

You can use derived signals to create other derived signals, making them very flexible and powerful. You can create entire computed **signal chains** that propagate through only to where they are subscribed.

```js
import { createDerived, createEffect, createSignal } from '@adamantjs/signals';

const [count, setCount] = createSignal(1);

const doubled = createDerived(() => {
  return count() * 2;
});

const quadrupled = createDerived(() => {
  return doubled() * 2;
});

createEffect(() => {
  console.log(quadrupled());
});

setInterval(() => {
  setCount(count() + 1);
}, 1000);
```

### `signalToStore` (Svelte)

Svelte users with a matching `svelte` peer dependency may use the specialised export `@adamantjs/signals/svelte`. This exposes an additional function `signalToStore` which allows Svelte components to reactively read the signal via `$`.

```svelte
<script>
  import { createSignal, signaltoStore } from '@adamantjs/signals/svelte';

  const [countSignal, setCount] = createSignal(0);

  const count = signalToStore(countSignal);
</script>

<button on:click={() => setCount($count + 1)}>{ $count }</button>
```
