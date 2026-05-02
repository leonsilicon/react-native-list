# React Native List

High-performance list primitives for React Native.

## Installation

```sh
bun add react-native-list
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

## Native Names

- npm package: `react-native-list`
- iOS module / pod: `ReactNativeList`
- Android namespace: `com.hannojg.reactnativelist`
- Nitro namespace: `reactnativelist`
