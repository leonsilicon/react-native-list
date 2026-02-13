// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, '..')
const rendererProxyThreadSwitchPath = path.resolve(
  __dirname,
  'renderer/RendererProxyThreadSwitch.js'
)

function isRendererProxyImport(moduleName) {
  return /(?:^|\/)RendererProxy(?:\.js)?$/.test(moduleName)
}

function isReactNativeDomInternalsImporter(originModulePath) {
  if (typeof originModulePath !== 'string') {
    return false
  }

  return originModulePath.includes(
    `${path.sep}node_modules${path.sep}react-native${path.sep}src${path.sep}private${path.sep}webapis${path.sep}dom${path.sep}nodes${path.sep}internals${path.sep}`
  )
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = {
    watchFolders: [root],
    resolver: {
        // block all node_modules in ../package/node_modules
        blockList: [
            /..\/package\/node_modules\/.*/,
        ],
        resolveRequest: (context, moduleName, platform) => {
            // Redirect only React Native DOM internals to a runtime-switching proxy.
            if (
              isRendererProxyImport(moduleName) &&
              isReactNativeDomInternalsImporter(context.originModulePath)
            ) {
              return {
                type: 'sourceFile',
                filePath: rendererProxyThreadSwitchPath,
              }
            }

            return context.resolveRequest(context, moduleName, platform)
        },
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
