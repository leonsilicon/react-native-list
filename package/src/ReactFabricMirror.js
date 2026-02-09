const Reconciler = require('react-reconciler')

// FabricUIManager is basically a wrapper around global.nativeFabricUIManager
// but caches each function to avoid recreating a jsi::HostFunction on each call.
const {
  getFabricUIManager,
} = require('react-native/Libraries/ReactNative/FabricUIManager')
const uiManager = getFabricUIManager()
console.log('[ReactFabricMirror] got FabricUIManager:', uiManager)

// const {
//   createPublicInstance,
//   createPublicTextInstance,
// } = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance');

const {
  create: createAttributePayload,
  diff: diffAttributePayloads,
} = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')

const ReactNativeViewConfigRegistry = require('react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry')

global.rootHostContext = {}
global.childHostContext = {}

const {
  NoEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  IdleEventPriority,
} = require('react-reconciler/constants')
global.currentUpdatePriority = NoEventPriority

global.rootInstance = {
  containerTag: 3,
  publicInstance: null,
}

const {getPublicInstance} = require('../shims/react-fiber-config-fabric.js')

//#region Setup event system
const { setComponentTree } = require('../../third_party/react/packages/react-native-renderer/src/legacy-events/EventPluginUtils')
const {
  injectEventPluginOrder,
  injectEventPluginsByName,
} = require('../../third_party/react/packages/react-native-renderer/src/legacy-events/EventPluginRegistry')
const ReactNativeBridgeEventPluginModule = require('../../third_party/react/packages/react-native-renderer/src/ReactNativeBridgeEventPlugin')
const ResponderEventPluginModule = require('../../third_party/react/packages/react-native-renderer/src/legacy-events/ResponderEventPlugin')
const ReactNativeEventPluginOrderModule = require('../../third_party/react/packages/react-native-renderer/src/ReactNativeEventPluginOrder')
const ReactFabricGlobalResponderHandlerModule = require('../../third_party/react/packages/react-native-renderer/src/ReactFabricGlobalResponderHandler')

const ReactNativeBridgeEventPlugin =
  ReactNativeBridgeEventPluginModule.default ?? ReactNativeBridgeEventPluginModule
const ResponderEventPlugin =
  ResponderEventPluginModule.default ?? ResponderEventPluginModule
const ReactNativeEventPluginOrder =
  ReactNativeEventPluginOrderModule.default ?? ReactNativeEventPluginOrderModule
const ReactFabricGlobalResponderHandler =
  ReactFabricGlobalResponderHandlerModule.default ?? ReactFabricGlobalResponderHandlerModule

function ensureLegacyEventPluginsInjected() {
  try {
    injectEventPluginOrder(ReactNativeEventPluginOrder)
  } catch (error) {
    // The plugin order can only be injected once for a given registry instance.
    if (!String(error).includes('Cannot inject event plugin ordering more than once')) {
      throw error
    }
  }

  injectEventPluginsByName({
    ResponderEventPlugin,
    ReactNativeBridgeEventPlugin,
  })

  setComponentTree(
    // Equivalent to ReactFabricComponentTree.getFiberCurrentPropsFromNode
    (instance) => instance?.canonical?.currentProps ?? null,
    // Equivalent to ReactFabricComponentTree.getInstanceFromNode
    (node) => {
      if (
        node?.canonical != null &&
        node.canonical.internalInstanceHandle != null
      ) {
        return node.canonical.internalInstanceHandle
      }
      return node ?? null
    },
    // Equivalent to ReactFabricComponentTree.getNodeFromInstance
    (fiber) => {
      const publicInstance = getPublicInstance(fiber.stateNode)
      if (publicInstance == null) {
        throw new Error('Could not find host instance from fiber')
      }
      return publicInstance
    }
  )

  ResponderEventPlugin.injection.injectGlobalResponderHandler(
    ReactFabricGlobalResponderHandler
  )
}

ensureLegacyEventPluginsInjected()

const {dispatchEvent} = require('../../third_party/react/packages/react-native-renderer/src/ReactFabricEventEmitter')
// This will be retrieved on the native side in JSI ... hm or we call and set it?
global.handleEvent = dispatchEvent
//#endregion

function log(...args) {
  // log('[ReactFabricMirror]', ...args)
  global._log?.(
    '[ReactFabricMirror] ' +
      args
        .map((a) => {
          try {
            return JSON.stringify(a)
          } catch (e) {
            return String(a)
          }
        })
        .join(' ')
  )
}
global.log = log

// Counter for uniquely identifying views.
// % 10 === 1 means it is a rootTag.
// % 2 === 0 means it is a Fabric tag.
// This means that they never overlap.
global.nextReactTag = 2

const HostConfig = {
  now: performance.now,
  getRootHostContext(rootContainerInstance) {
    return global.rootHostContext
  },
  getChildHostContext() {
    return global.childHostContext
  },
  //   prepareForCommit(containerInfo) {},
  //   resetAfterCommit(containerInfo) {},
  supportsPersistence: true,
  createInstance: (
    type,
    props,
    rootContainerInstance,
    _currentHostContext,
    workInProgress
  ) => {
    const tag = global.nextReactTag
    global.nextReactTag += 2

    const viewConfig = ReactNativeViewConfigRegistry.get(type)
    const updatePayload = createAttributePayload(
      props,
      viewConfig.validAttributes
    )

    let node
    try {
      log('[createInstance] calling createNode with type=', type, 'tag=', tag)
      log('[createInstance] props=', updatePayload)
      node = uiManager.createNode(
        tag, // reactTag
        viewConfig.uiViewClassName, // viewName
        rootContainerInstance.containerTag, // rootTag
        updatePayload, // props
        workInProgress // internalInstanceHandle
      )
    } catch (e) {
      log('[createInstance] ERROR in createNode:', e.message || String(e))
      log('Stack:', new Error().stack)
      throw e
    }

    return {
      node: node,
      canonical: {
        nativeTag: tag,
        viewConfig, // TODO: is this needed? for what
        currentProps: props, // funny, react is passing here props instead of updatePayload, is this okay?
        internalInstanceHandle: workInProgress,
        publicInstance: null,
        publicRootInstance: rootContainerInstance.publicInstance,
      },
    }
  },

  finalizeInitialChildren(parentInstance, type, props, hostContext) {
    log('[finalizeInitialChildren]')
    return false
  },

  cloneInstance(instance, type, oldProps, newProps, keepChildren, newChildSet) {
    log('[cloneInstance] tag=', instance.canonical.nativeTag)

    const viewConfig = instance.canonical.viewConfig
    const updatePayload = diffAttributePayloads(
      oldProps,
      newProps,
      viewConfig.validAttributes
    )
    log('[cloneInstance] updatePayload=', updatePayload)
    // TODO: If the event handlers have changed, we need to update the current props
    // in the commit phase but there is no host config hook to do it yet.
    // So instead we hack it by updating it in the render phase.
    instance.canonical.currentProps = newProps

    const node = instance.node
    let clone
    if (keepChildren) {
      if (updatePayload !== null) {
        clone = uiManager.cloneNodeWithNewProps(node, updatePayload)
      } else {
        // No changes
        return instance
      }
    } else {
      // If passChildrenWhenCloningPersistedNodes is enabled, children will be non-null
      if (newChildSet != null) {
        if (updatePayload !== null) {
          clone = uiManager.cloneNodeWithNewChildrenAndProps(
            node,
            newChildSet,
            updatePayload
          )
        } else {
          clone = uiManager.cloneNodeWithNewChildren(node, newChildSet)
        }
      } else {
        if (updatePayload !== null) {
          clone = uiManager.cloneNodeWithNewChildrenAndProps(
            node,
            updatePayload
          )
        } else {
          clone = uiManager.cloneNodeWithNewChildren(node)
        }
      }
    }

    return {
      node: clone,
      canonical: instance.canonical,
    }
  },
  createTextInstance(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    const tag = global.nextReactTag
    global.nextReactTag += 2

    const node = uiManager.createNode(
      tag, // reactTag
      'RCTRawText', // viewName
      rootContainerInstance.containerTag, // rootTag
      { text: text }, // props
      internalInstanceHandle // instance handle
    )

    return {
      node: node,
    }
  },
  createContainerChildSet() {
    log('[createContainerChildSet]')
    return uiManager.createChildSet()
  },
  appendChildToContainerChildSet(childSet, child) {
    log('[appendChildToContainerChildSet]')
    uiManager.appendChildToSet(childSet, child.node)
  },
  finalizeContainerChildren(container, newChildren) {
    // Noop - children will be replaced in replaceContainerChildren
    log('[finalizeContainerChildren]')
  },
  appendInitialChild(parentInstance, child) {
    log('[appendInitialChild]')
    uiManager.appendChild(parentInstance.node, child.node)
  },
  replaceContainerChildren(container, newChildren) {
    log('[replaceContainerChildren]')
    uiManager.completeRoot(container.containerTag, newChildren)
  },

  // TODO: hm, this could get problematic, to share event priorities between the fabric ui manager.
  // Maybe we need to create a clone of the ui manager? the important thing is that all view managers are resolved when we do so.
  // However that would concern me if commitHooks from reanimated would work.
  setCurrentUpdatePriority(priority) {
    global.currentUpdatePriority = priority
  },
  getCurrentUpdatePriority() {
    return global.currentUpdatePriority
  },
  resolveUpdatePriority() {
    if (global.currentUpdatePriority !== NoEventPriority) {
      return global.currentUpdatePriority
    } else {
      return DefaultEventPriority
    }
    // TODO:
    /*   const currentEventPriority = fabricGetCurrentEventPriority
    ? fabricGetCurrentEventPriority()
    : null;

  if (currentEventPriority != null) {
    switch (currentEventPriority) {
      case FabricDiscretePriority:
        return DiscreteEventPriority;
      case FabricContinuousPriority:
        return ContinuousEventPriority;
      case FabricIdlePriority:
        return IdleEventPriority;
      case FabricDefaultPriority:
      default:
        return DefaultEventPriority;
    }
  }

  return DefaultEventPriority; */
  },

  getPublicInstance(instance) {
    return getPublicInstance(instance)
  },

  // getPublicTextInstance(textInstance, internalInstanceHandle) {
  //   if (textInstance.publicInstance == null) {
  //     textInstance.publicInstance = createPublicTextInstance(
  //       internalInstanceHandle
  //     )
  //   }
  //   return textInstance.publicInstance
  // },
  // getPublicInstanceFromInternalInstanceHandle(internalInstanceHandle) {
  //   const instance = internalInstanceHandle.stateNode

  //   // React resets all the fields in the fiber when the component is unmounted
  //   // to prevent memory leaks.
  //   if (instance == null) {
  //     return null
  //   }

  //   if (internalInstanceHandle.tag === HostText) {
  //     const textInstance = instance
  //     return this.getPublicTextInstance(textInstance, internalInstanceHandle)
  //   }

  //   const elementInstance = internalInstanceHandle.stateNode
  //   return this.getPublicInstance(elementInstance)
  // },

  prepareForCommit(containerInfo) {
    return null
  },
  resetAfterCommit(containerInfo) {},

  trackSchedulerEvent() {},
  resolveEventType() {
    return null
  },
  resolveEventTimeStamp() {
    return -1.1
  },
  shouldAttemptEagerTransition() {
    return false
  },
  shouldSetTextContent(type, props) {
    return false
  },
  // TODO: microtask scheduling, should work with worklets on the UI thread i believe! not sure though if even RN implements this?
  supportsMicrotasks: false,

  detachDeletedInstance(node) {},
  beforeActiveInstanceBlur(internalInstanceHandle) {
    // noop
  },

  afterActiveInstanceBlur() {
    // noop
  },

  preparePortalMount(portalInstance) {
    // noop
  },

  detachDeletedInstance(node) {
    // noop
  },

  requestPostPaintCallback(callback) {
    // noop
  },

  maySuspendCommit(type, props) {
    return false
  },

  maySuspendCommitOnUpdate(type, oldProps, newProps) {
    return false
  },
  maySuspendCommitInSyncRender(type, props) {
    return false
  },

  preloadInstance(instance, type, props) {
    return true
  },
  startSuspendingCommit() {
    return null
  },
  suspendInstance(state, instance, type, props) {},

  suspendOnActiveViewTransition(state, container) {},

  waitForCommitToBeReady(state, timeoutOffset) {
    return null
  },

  getSuspendedCommitReason(state, rootContainer) {
    return null
  },

  isPrimaryRenderer: false,
}

const Renderer = Reconciler(HostConfig)
global.React = require('react')

global.Render = function (element, callback) {
  if (!global.rootContainer) {
    global.rootContainer = Renderer.createContainer(
      global.rootInstance,
      0, // concurrentRoot ? 1 : 0
      null,
      false,
      null,
      'ui-renderer',
      function onUncaughtError(error, info) {
        console.error(
          '[ReactFabricMirror] Uncaught error in React renderer: ',
          error,
          info
        )
      },
      function onCaughtError(error, info) {
        console.error(
          '[ReactFabricMirror] Caught error in React renderer: ',
          error,
          info
        )
      },
      function onRecoverableError(error, info) {
        console.error(
          '[ReactFabricMirror] Recoverable error in React renderer: ',
          error,
          info
        )
      },
      function nativeOnDefaultTransitionIndicator() {
        // Native doesn't have a default indicator.
      }
    )
  }

  // updateContainerSync + flushSyncWork is making the renderer work immediately/blocking/…sync
  Renderer.updateContainerSync(element, global.rootContainer, null, callback)
  // Renderer.flushPassiveEffects();
  Renderer.flushSyncWork()
  log('[ReactFabricMirror] updateContainer finished')
}
log('[ReactFabricMirror] ReactFabricMirror initialized')
