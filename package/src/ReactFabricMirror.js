const Reconciler = require('react-reconciler')
// const {
//   createAttributePayload,
//   diffAttributePayloads,
// } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

const {
  create: createAttributePayload,
  diff: diffAttributePayloads,
} = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload')

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

function log(...args) {
  // log('[ReactFabricMirror]', ...args)
  global._log(
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
    newProps,
    rootContainerInstance,
    _currentHostContext,
    workInProgress
  ) => {
    // try {
    //   const viewConfig = global.rnViewConfigs.get(type);
    //   log('[createInstance] viewConfig=', viewConfig);
    // } catch (e) {
    //   log('[createInstance] ERROR getting view config for type=', type, ' error=', e.message || String(e))
    //   throw e
    // }

    // log('[createInstnace] debugA')
    const tag = global.nextReactTag
    global.nextReactTag += 2
    // log('[createInstnace] debugB')

    // TODO:

    //   if (__DEV__) {
    //     for (const key in viewConfig.validAttributes) {
    //       if (props.hasOwnProperty(key)) {
    //         deepFreezeAndThrowOnMutationInDev(props[key]);
    //       }
    //     }
    //   }

    const viewConfig = new Proxy(
      {},
      {
        get: (target, prop) => {
          // log('[createInstance] ValidAttributes proxy get for prop=', prop)
          if (prop === 'children' || prop === 'ref') {
            // log('[createInstance] ValidAttributes proxy returning false for prop=', prop)
            return undefined
          }
          if (prop === 'style') {
            return new Proxy(
              {},
              {
                get: (target, styleProp) => {
                  return true
                },
              }
            )
          }
          return true
        },
      }
    )
    // log('[createInstance] viewConfig proxy created, test, viewConfig.test=', viewConfig.test)
    const updatePayload = createAttributePayload(newProps, viewConfig)

    let node
    try {
      log('[createInstance] calling createNode with type=', type, 'tag=', tag)
      log('[createInstance] props=', updatePayload)
      node = nativeFabricUIManager.createNode(
        tag, // reactTag
        type, // viewName
        rootContainerInstance.containerTag, // rootTag
        updatePayload, // props
        workInProgress // internalInstanceHandle
      )
      log('[createInstance] node=', node)
    } catch (e) {
      log('[createInstance] ERROR in createNode:', e.message || String(e))
      log('Stack:', new Error().stack)
      throw e
    }

    // I think react is using getPublicInstance here
    return {
      node: node,
      canonical: {
        nativeTag: tag,
        viewConfig, // TODO: is this needed? for what
        currentProps: newProps, // funny, react is passing here props instead of updatePayload, is this okay?
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
        clone = nativeFabricUIManager.cloneNodeWithNewProps(node, updatePayload)
      } else {
        // No changes
        return instance
      }
    } else {
      // If passChildrenWhenCloningPersistedNodes is enabled, children will be non-null
      if (newChildSet != null) {
        if (updatePayload !== null) {
          clone = nativeFabricUIManager.cloneNodeWithNewChildrenAndProps(
            node,
            newChildSet,
            updatePayload
          )
        } else {
          clone = nativeFabricUIManager.cloneNodeWithNewChildren(
            node,
            newChildSet
          )
        }
      } else {
        if (updatePayload !== null) {
          clone = nativeFabricUIManager.cloneNodeWithNewChildrenAndProps(
            node,
            updatePayload
          )
        } else {
          clone = nativeFabricUIManager.cloneNodeWithNewChildren(node)
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

    const node = nativeFabricUIManager.createNode(
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
    return nativeFabricUIManager.createChildSet()
  },
  appendChildToContainerChildSet(childSet, child) {
    log('[appendChildToContainerChildSet]')
    nativeFabricUIManager.appendChildToSet(childSet, child.node)
  },
  finalizeContainerChildren(container, newChildren) {
    // Noop - children will be replaced in replaceContainerChildren
    log('[finalizeContainerChildren]')
  },
  appendInitialChild(parentInstance, child) {
    log('[appendInitialChild]')
    nativeFabricUIManager.appendChild(parentInstance.node, child.node)
  },
  replaceContainerChildren(container, newChildren) {
    log('[replaceContainerChildren]')
    nativeFabricUIManager.completeRoot(container.containerTag, newChildren)
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
    // TODO: implement returning react element
    return instance
  },

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
log(
  '[ReactFabricMirror] ReactFabricMirror initialized',
  typeof global.React.createRef
)
