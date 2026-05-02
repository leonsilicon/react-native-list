'use strict'

function isReactNativeRuntime() {
  return global.__RUNTIME_KIND === 1
}

let cachedReactNativeRendererProxy
function getReactNativeRendererProxy() {
  if (cachedReactNativeRendererProxy == null) {
    // Intentionally lazy: avoid loading the default RN renderer in non-RN runtimes.
    // eslint-disable-next-line @react-native/no-deep-imports
    cachedReactNativeRendererProxy = require('react-native/Libraries/ReactNative/RendererProxy')
  }
  return cachedReactNativeRendererProxy
}

function getNodeFromInternalInstanceHandle(internalInstanceHandle) {
  if (isReactNativeRuntime()) {
    return getReactNativeRendererProxy().getNodeFromInternalInstanceHandle(
      internalInstanceHandle
    )
  }

  const stateNode = internalInstanceHandle?.stateNode
  if (stateNode == null) {
    return null
  }
  return stateNode.node ?? stateNode
}

function getPublicInstanceFromInternalInstanceHandle(internalInstanceHandle) {
  if (isReactNativeRuntime()) {
    return getReactNativeRendererProxy().getPublicInstanceFromInternalInstanceHandle(
      internalInstanceHandle
    )
  }

  const stateNode = internalInstanceHandle?.stateNode
  if (stateNode == null) {
    return null
  }

  if (stateNode.canonical?.publicInstance != null) {
    return stateNode.canonical.publicInstance
  }

  return stateNode.node ?? stateNode
}

function getPublicInstanceFromRootTag(rootTag) {
  if (isReactNativeRuntime()) {
    return getReactNativeRendererProxy().getPublicInstanceFromRootTag(rootTag)
  }

  if (global.rootInstance?.containerTag === Number(rootTag)) {
    return global.rootInstance.publicInstance ?? null
  }

  return null
}

module.exports = {
  getNodeFromInternalInstanceHandle,
  getPublicInstanceFromInternalInstanceHandle,
  getPublicInstanceFromRootTag,
}
