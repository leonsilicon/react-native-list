import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';

export const stripFlowPlugin = {
  name: 'strip-flow-types',
  setup(build) {
    // Match react-native and @react-native packages
    build.onLoad({ filter: /node_modules[\/\\](@react-native[\/\\]|react-native[\/\\]).*\.jsx?$/ }, ({ path, loader }) => {
      const contents = readFileSync(path, 'utf-8');

      const result = transformSync(contents, {
        filename: path,
        presets: ['@react-native/babel-preset'],
        // Don't look for config files
        configFile: false,
        babelrc: false,
        // We only want to strip Flow types, not transform everything
        caller: {
          name: 'bun-bundler',
          supportsStaticESM: true,
        },
      });

      return { contents: result?.code ?? contents, loader };
    });
  },
};
