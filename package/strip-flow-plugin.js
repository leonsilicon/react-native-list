import { readFileSync } from 'node:fs';
import stripTypes from 'flow-remove-types';

export const stripFlowPlugin = {
  name: 'strip-flow-types',
  setup(build) {
    build.onLoad({ filter: /node_modules[\/\\]react-native[\/\\].*\.jsx?$/ }, ({ path, loader }) => {
      const contents = readFileSync(path, 'utf-8');
      const strippedContents = stripTypes(contents).toString();
      return { contents: strippedContents, loader };
    });
  },
};
