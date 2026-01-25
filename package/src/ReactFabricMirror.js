globalThis.reportError = console.error
const Reconciler = require('react-reconciler')

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
  containerTag: 1, // 0 is the root instance of our main react native app i believe
  publicInstance: null,
}

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
  prepareForCommit(containerInfo) {},
  resetAfterCommit(containerInfo) {},
  // TODO: switch to persistent mode, once figured out the worklets part
  supportsMutation: true,
  createInstance: (
    type,
    newProps,
    rootContainerInstance,
    _currentHostContext,
    workInProgress
  ) => {
    console.log('[createInstnace] debugA')
    const tag = global.nextReactTag
    global.nextReactTag += 2
    console.log('[createInstnace] debugB')

    // TODO:
    //   const viewConfig = getViewConfigForType(type);

    //   if (__DEV__) {
    //     for (const key in viewConfig.validAttributes) {
    //       if (props.hasOwnProperty(key)) {
    //         deepFreezeAndThrowOnMutationInDev(props[key]);
    //       }
    //     }
    //   }

    //   const updatePayload = createAttributePayload(
    //     props,
    //     viewConfig.validAttributes,
    //   );

    const node = nativeFabricUIManager.createNode(
      tag, // reactTag
      type, // viewName
      rootContainerInstance.containerTag, // rootTag
      newProps, // props
      workInProgress // internalInstanceHandle
    )

    console.log('[createInstance] node=', node)

    // I think react is using getPublicInstance here
    return {
      node: node,
      canonical: {
        nativeTag: tag,
        //   viewConfig, // TODO: is this needed? for what
        currentProps: newProps, // funny, react is passing here props instead of updatePayload, is this okay?
        internalInstanceHandle: workInProgress,
        publicInstance: null,
        publicRootInstance: rootContainerInstance.publicInstance,
      },
    }
  },

  appendInitialChild(parentInstance, child) {
    console.log('[appendInitialChild]')
  },
  appendChild(parent, child) {
    console.log('[appendChild]')
  },
  finalizeInitialChildren(element, type, props) {
    console.log('[finalizeInitialChildren]')
  },
  appendChildToContainer(container, child) {
    console.log('[appendChildToContainer]')
  },
  prepareUpdate(instance, oldProps, newProps) {
    console.log('[prepareUpdate]')
    return true
  },
  commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
    console.log('[commitUpdate]')
  },
  commitTextUpdate(textInstance, oldText, newText) {
    console.log('[commitTextUpdate]')
  },
  removeChild(parentInstance, child) {
    console.log('[removeChild]')
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
    return false;
  },
  getPublicInstance(instance) {
    // TODO: implement returning react element
    return instance
  },
  supportsMicrotasks: false,

  // TODO: microtask scheduling, should work with worklets on the UI thread i believe!

  // TODO: those methods are for mutable mode and should be removed later
  clearContainer(container) {},

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
        console.error('[ReactFabricMirror] Uncaught error in React renderer: ',
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

  // TODO: there is also: updateContainerSync
  return Renderer.updateContainer(element, global.rootContainer, null, callback) // TODO: maybe skip callback for now?
}
