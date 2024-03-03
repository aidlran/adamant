# Changelog

## 0.2.0 (2024-03-03)

### Breaking

- **signals:** rename exported functions ([870cf4c](https://github.com/aidlran/signals/commit/870cf4ce45e51bd737d2cc3d1030a9862de51fb8))
  - `createSignal` is now `signal`
  - `createEffect` is now `effect`
  - `createDerived` is now `derived`

### Performance

- **signals:** subscription optimisations for derived signals ([870cf4c](https://github.com/aidlran/signals/commit/870cf4ce45e51bd737d2cc3d1030a9862de51fb8))

### Tests

- **signals:** added a test suite ([870cf4c](https://github.com/aidlran/signals/commit/870cf4ce45e51bd737d2cc3d1030a9862de51fb8))

## 0.1.1 (2024-02-25)

### Features

- **signals:** add awaitable `tick` ([4e50ada](https://github.com/aidlran/signals/commit/4e50adace6469415a7a7f0f60989066dc3ceba87))

## 0.1.0 (2024-01-26)

### Features

- **signals:** add `createDerived` ([e237aa9](https://github.com/aidlran/signals/commit/e237aa93eab00deb415ee7c85ccd63bc51a5fe39))
- **signals:** add `createEffect` ([92c0693](https://github.com/aidlran/signals/commit/92c06930d84fe7cdb934ab1a1a64ae60df5ac1c6))
- **signals:** add `createSignal` ([cd051a5](https://github.com/aidlran/signals/commit/cd051a52f900d4476eaec3c6988751feebe3aa20))
- **signals:** add `signalToStore` helper for Svelte ([77628f2](https://github.com/aidlran/signals/commit/77628f21384bf33f62fe501a801732b9f2aea061))
- **signals:** `createEffect` returns an unsubscribe function ([9b2c804](https://github.com/aidlran/signals/commit/9b2c804eda2c62e24054ce9e6cb3cd39beae5840))

### Documentation

- **signals:** add README ([621c59a](https://github.com/aidlran/signals/commit/621c59a2e2f7e2ccf3f0c9a10db59d6c1be9e4ea))
- **signals:** update jsdoc ([cc8d98e](https://github.com/aidlran/signals/commit/cc8d98ec28d0d3477d55c801191ebe9196a42c8e))

### Performance

- **signals:** batch notify in microtask queue ([e22e059](https://github.com/aidlran/signals/commit/e22e059d79b7dce1897c30c4b80505628b8023cd))
- **signals:** prevent multiple effect execution per tick ([9e31364](https://github.com/aidlran/signals/commit/9e313641d596fce78b3ef97894605d6ff3261951))
