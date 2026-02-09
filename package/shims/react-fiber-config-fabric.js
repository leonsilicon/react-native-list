const ReactNativeElement = require('react-native/src/private/webapis/dom/nodes/ReactNativeElement').default

function getPublicInstance(instance) {
  // return instance;
  if (instance?.canonical != null) {
    if (instance.canonical.publicInstance == null) {
      instance.canonical.publicInstance = new ReactNativeElement(
          instance.canonical.nativeTag,
          instance.canonical.viewConfig,
          instance.canonical.internalInstanceHandle,
          // TODO: this might need to be passed through createPublicRootInstance/createReactNativeDocument
          instance.canonical.publicRootInstance ?? null
        );
      instance.canonical.publicRootInstance = null
    }
    return instance.canonical.publicInstance
  }

  if (instance?.containerInfo?.publicInstance != null) {
    return instance.containerInfo.publicInstance
  }

  if (instance?._nativeTag != null) {
    return instance
  }

  return null
}

module.exports = {
  getPublicInstance,
}
