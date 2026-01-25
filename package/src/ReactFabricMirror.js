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
    console.log('createInstance', type, newProps)
    // I think react is using getPublicInstance here
    return null
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
    return null;
  },
  resolveEventTimeStamp() {
    return -1.1;
  },
  shouldAttemptEagerTransition() {
    return false;
  },

  // TODO: microtask scheduling, should work with worklets on the UI thread i believe!

  // TODO: those methods are for mutable mode and should be removed later
  clearContainer(container) {},
}

const Renderer = Reconciler(HostConfig)
// global.React = require('react')

global.Render = function (element, container, callback) {
  if (!global.rootContainer) {

    const rootInstance = {
      containerTag: 1, // 0 is the root instance of our main react native app i believe
      publicInstance: null,
    }
    global.rootContainer = Renderer.createContainer(
      rootInstance,
      0, // concurrentRoot ? 1 : 0
      null,
      false,
      null,
      'ui-renderer',
      console.error,
      console.error,
      console.error,
      function nativeOnDefaultTransitionIndicator() {
        // Native doesn't have a default indicator.
      }
    )
  }

  return Renderer.updateContainer(element, global.rootContainer, null, callback) // TODO: maybe skip callback for now?
}
