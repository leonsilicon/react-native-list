# React Native List

High-performance list primitives for React Native.

## Installation

> [!WARNING]
> Using this library requires you to use [react-native-worklets **bundle mode**](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup).
>
> - Please follow the setup instructions of it first, and make sure your app works before using react-native-list!
> - You need at least version 0.9.1!

> [!CAUTION]
> Right now you will have to patch react-native-worklets. Once those PRs are landed upstream it will no longer be necessary:
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
