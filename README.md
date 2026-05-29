# React Native List

High-performance list primitives for React Native.

- 📱 True native [`UICollectionView`](https://developer.apple.com/documentation/uikit/uicollectionview) on iOS
- 🤖 True native [`RecyclerView`](https://developer.android.com/develop/ui/views/layout/recyclerview) on android
- 🔄 Synchronous rendering of react components using "worklet" function components
- 🐎 Platform native animations out of the box for list item transitions
- 📉 Low memory usage due to true native view recycling

https://github.com/user-attachments/assets/bd1eddd7-e166-4b91-b7ee-d177ce8edb58

## Installation

> [!WARNING]
> Using this library requires you to use [react-native-worklets **bundle mode**](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup).
>
> - Please follow the setup instructions of it first, and make sure your app works before using react-native-list!
> - You need at least version 0.9.1!

> [!CAUTION]
> Right now you will have to patch react-native-worklets. See the patch file here and ask your friendly AI to apply it:
>
> - [react-native-worklets@0.9.1.patch](https://github.com/hannojg/react-native-list/blob/main/patches/react-native-worklets%400.9.1.patch)
>
> Once those PRs are landed upstream it will no longer be necessary:
>
> - [fix(bundlemode): getBundleModeMetroConfig consider user config's resolveRequest](https://github.com/software-mansion/react-native-reanimated/pull/9327)
> - [worklets plugin: allow react-native imports in bundle mode](https://github.com/software-mansion/react-native-reanimated/pull/9213)
> - [worklets plugin: Add opt-in bundle mode JSX component capture](https://github.com/software-mansion/react-native-reanimated/pull/9212)

Once that's out of the way, you can start with the regular setup of the library:

```sh
bun add react-native-list
```

### Configuring Metro

Simply wrap your config with `getReactNativeListMetroConfig` in `metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const rnlistConfig = getReactNativeListMetroConfig(getDefaultConfig());
module.exports = rnlistConfig;
```

> [!NOTE]
> If you're using expo you need to make sure to enable inline requires in your metro config:
>
> ```js
> const config = {
>   transformer: {
>     getTransformOptions: async () => ({
>       transform: {
>         // Bundle mode only works with inline support
>         // See: https://github.com/software-mansion/react-native-reanimated/issues/8904
>         inlineRequires: true,
>       },
>     }),
>   },
> };
> ```
>
> If you don't see a `metro.config.js` in your project, see [expo's documentation on modifying metro](https://docs.expo.dev/guides/customizing-metro/).

## Simple example

XXXX

## API

XXXX

## Benchmark

XXXX

## Development

First clone init the submodules:

```sh
git submodule update --init --recursive
```

Regenerate native Nitro specs after changing files in `src/specs` or `nitro.json`:

```sh
bun specs
```

Run TypeScript checks:

```sh
bun run typecheck
```
