import { describe, test } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { derived, effect, signal, tick } from '../../dist/mjs/signals.js';

describe('signal', () => {
  test('increment counter', () => {
    const [count, setCount] = signal(0);
    strictEqual(count(), 0);
    setCount(1);
    strictEqual(count(), 1);
  });

  describe('onSubscribe hook', () => {
    test('with effect', () => {
      let subscribeCalls = 0;
      let unsubscribeCalls = 0;
      const [get, set] = signal(0, () => {
        subscribeCalls++;
        return () => {
          unsubscribeCalls++;
        };
      });
      const check = (nSubscribe, nUnsubscribe) => {
        set(get() + 1);
        strictEqual(subscribeCalls, nSubscribe);
        strictEqual(unsubscribeCalls, nUnsubscribe);
      };
      check(0, 0);
      get();
      check(0, 0);
      const unsubscribeA = effect(() => get());
      check(1, 0);
      const unsubscribeB = effect(() => get());
      check(1, 0);
      unsubscribeB();
      check(1, 0);
      unsubscribeA();
      check(1, 1);
    });

    test('with derived', () => {
      let subscribeCalls = 0;
      let unsubscribeCalls = 0;
      const [get, set] = signal(0, () => {
        subscribeCalls++;
        return () => {
          unsubscribeCalls++;
        };
      });
      const check = (nSubscribe, nUnsubscribe) => {
        set(get() + 1);
        strictEqual(subscribeCalls, nSubscribe);
        strictEqual(unsubscribeCalls, nUnsubscribe);
      };
      check(0, 0);
      get();
      check(0, 0);
      const derivedSignal = derived(() => get() * 100);
      check(0, 0);
      derived();
      check(0, 0);
      const unsubscribe = effect(() => derivedSignal());
      check(1, 0);
      unsubscribe();
      check(1, 1);
    });
  });
});

test('effect', async () => {
  let notifications = 0;
  const [count, setCount] = signal(0);
  const unsubscribe = effect(() => {
    count();
    notifications++;
  });

  // runs once immediately
  strictEqual(notifications, 1);

  // isn't notified before tick
  setCount(count() + 1);
  strictEqual(notifications, 1);

  // is notified after tick
  await tick();
  strictEqual(notifications, 2);

  // unsubscribe works
  unsubscribe();
  setCount(count() + 1);
  await tick();
  strictEqual(notifications, 2);
});

describe('derived', () => {
  const [count, setCount] = signal(1);
  const doubled = derived(() => count() * 2);
  const quadrupled = derived(() => doubled() * 2);

  test('doubled example', () => {
    // calculates immediately
    strictEqual(count(), 1);
    strictEqual(doubled(), 2);

    // can immediately pull the current value before tick
    setCount(count() + 1);
    strictEqual(count(), 2);
    strictEqual(doubled(), 4);
  });

  test('chained quadrupled example', () => {
    // calculates immediately
    strictEqual(count(), 2);
    strictEqual(doubled(), 4);
    strictEqual(quadrupled(), 8);

    // can immediately pull the current value before tick
    setCount(count() + 1);
    strictEqual(count(), 3);
    strictEqual(doubled(), 6);
    strictEqual(quadrupled(), 12);
  });

  test('with effect', async () => {
    let pushedDoubled,
      pushedQuadrupled,
      doubledCalls = 0,
      quadrupledCalls = 0,
      effectCalls = 0;

    const [count, setCount] = signal(1);
    const doubled = derived(() => {
      doubledCalls++;
      return count() * 2;
    });
    const quadrupled = derived(() => {
      quadrupledCalls++;
      return doubled() * 2;
    });

    strictEqual(doubledCalls, 0);
    strictEqual(quadrupledCalls, 0);

    const unsubscribe = effect(() => {
      effectCalls++;
      pushedDoubled = doubled();
      pushedQuadrupled = quadrupled();
    });
    strictEqual(doubledCalls, 2);
    strictEqual(quadrupledCalls, 1);
    strictEqual(effectCalls, 1);
    strictEqual(pushedDoubled, 2);
    strictEqual(pushedQuadrupled, 4);

    setCount(count() + 1);

    strictEqual(doubledCalls, 2);
    strictEqual(quadrupledCalls, 1);
    strictEqual(effectCalls, 1);
    strictEqual(pushedDoubled, 2);
    strictEqual(pushedQuadrupled, 4);

    await tick();

    strictEqual(doubledCalls, 6);
    strictEqual(quadrupledCalls, 3);
    strictEqual(effectCalls, 2);
    strictEqual(pushedDoubled, 4);
    strictEqual(pushedQuadrupled, 8);

    unsubscribe();

    setCount(count() + 1);
    await tick();
    strictEqual(doubledCalls, 6);
    strictEqual(quadrupledCalls, 3);
    strictEqual(effectCalls, 2);
    strictEqual(pushedDoubled, 4);
    strictEqual(pushedQuadrupled, 8);
  });
});
