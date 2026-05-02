'use strict'

const path = require('path')

const rendererProxyThreadSwitchPath = path.resolve(
  __dirname,
  'metro/RendererProxyThreadSwitch.js'
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

function getReactNativeListMetroConfig(config) {
  config.resolver = config.resolver || {}
  const currentResolveRequest = config.resolver.resolveRequest

  config.resolver.resolveRequest = (context, moduleName, platform) => {
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

    return (currentResolveRequest || context.resolveRequest)(
      context,
      moduleName,
      platform
    )
  }

  return config
}

module.exports = {
  getReactNativeListMetroConfig,
}
