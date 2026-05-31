# React Native List

High-performance list primitives for React Native.

- 📱 True native [`UICollectionView`](https://developer.apple.com/documentation/uikit/uicollectionview) on iOS
- 🤖 True native [`RecyclerView`](https://developer.android.com/develop/ui/views/layout/recyclerview) on android
- 🔄 Synchronous rendering of react components using "worklet" function components
- 🐎 Platform native animations out of the box for list item transitions
- 📉 Low memory usage due to true native view recycling

<video src="https://github.com/user-attachments/assets/bd1eddd7-e166-4b91-b7ee-d177ce8edb58" width="320" controls align="right"></video>

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

```tsx
import {  List, useLinearListLayout, useListDataSource } from "react-native-list";
import type { ListItem, ListRenderers } from "react-native-list";

type TextItem = ListItem<
  // The type of your list item
  "text",
  // The data shape for that list item:
  {
    text: string;
  }
>;

type ImageItem = ...

type Items = TextItem | ImageItem

// Provide render functions for your item types:
const renderers: ListRenderers<Items> = {
  text: {
    renderItemWorklet: ({ item }) => {
      "worklet";

      return (
        <View
          style={{
            justifyContent: "center",
            paddingHorizontal: 16,
            backgroundColor: "#f6f8fa",
          }}
        >
          // Note: there are two phases: 1. View creation (without data), 2. binding data to the views
          //       that's why item.data can be undefined because the native list is requesting to
          //       create the view hierarchy, but without any data yet.
          <Text>{item.data?.text}</Text>
        </View>
      );
    },
  },
  image: ...
};

export function ExampleList() {
  const dataSource = useListDataSource<Items>({
    data: [...],
  });
  const layout = useLinearListLayout({
    itemSpacing: 8,
  });

  return (
    <List
      dataSource={dataSource}
      layout={layout}
      renderers={renderers}
      style={{
        flex: 1,
      }}
    />
  );
}
```

## API

XXXX

## Benchmark

|           | react-native-list | Legend List |
| --------- | ----------------- | ----------- |
| FPS       | 60                | 60          |
| Memory    | 86.88mb           | 86.89mb     |
| Total CPU | 185.93%           | 144.69%     |
| Can blank | no                | yes         |

Performance difference is best described as this:

- With react-native-list you will never get a blank. However, instead, you could see UI thread drop frames if your item rendering is too heavy.
- With Legend List you may see blanks, however, its way less likely you will drop frames on the UI thread (instead your JS thread might be fully busy, but you won't really get to notice that on the UIs performance)

## Known performance pitfalls

- For iOS when using dynamically sized items, try to use `iosConfig.estimatedItemSize` to roughly specify how many items will be visible in the view port. This can help a lot with performance.
- When specifying sizes for items use `useLinearListLayout({})` inset configs. Avoid setting a width in the styles that exceed the actual available view port width.
- In your item render function, when you have no item data yet it is tempting to return early with `null` or just an empty `<View />`. However, this is super bad for performance. There are two phases for native lists. First is view creation, where you're expected to create the view hierarchy for your item - just not with any data yet (so that any data could be bind to it). The second phase is actually binding data to the view. This will result in a simple "update props" operation on the native side instead of needing to create a new view hierarchy. Example:

Bad:

```jsx
renderItemWorklet: ({ item }) => {
  "worklet";
  if (item == null) return <View />
  return (
    <View>
      <Image src={item.image}>
      <Text>{item.userName}</Text>
    </View>
  )
```

Good:

```jsx
renderItemWorklet: ({ item }) => {
  "worklet";
  return (
    <View>
      <Image src={item?.image}>
      <Text>{item?.userName ?? ""}</Text>
    </View>
  )
```

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
