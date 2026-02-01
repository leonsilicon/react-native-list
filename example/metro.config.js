// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, '..')

/** @type {import('expo/metro-config').MetroConfig} */
const config = {
    watchFolders: [root],
    resolver: {
        // block all node_modules in ../package/node_modules
        blockList: [
            /..\/package\/node_modules\/.*/,
        ],
    },
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: true,
                // Bundle mode only works with inline support
                // See: https://github.com/software-mansion/react-native-reanimated/issues/8904
                inlineRequires: true,
            }
        })
    }
}

const {
    bundleModeMetroConfig,
} = require('react-native-worklets/bundleMode');


module.exports = mergeConfig(defaultConfig, bundleModeMetroConfig, config);
module.exports.transformer.getTransformOptions().then(console.log)
