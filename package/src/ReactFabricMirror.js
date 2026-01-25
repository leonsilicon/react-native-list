globalThis.reportError = console.error
const Reconciler = require("react-reconciler");

global.rootHostContext = {};
global.childHostContext = {};

const HostConfig = {
    now: performance.now,
    getRootHostContext(rootContainerInstance) {
        return global.rootHostContext;
    },
    getChildHostContext() {
        return global.childHostContext;
    },
    prepareForCommit(containerInfo) {},
    resetAfterCommit(containerInfo) {},
    // TODO: switch to persistent mode, once figured out the worklets part
    supportsMutation: true,
    createInstance: (type, newProps, rootContainerInstance, _currentHostContext, workInProgress) => {
        console.log("createInstance", type, newProps);
        // I think react is using getPublicInstance here
        return null;
    }

    // TODO: microtask scheduling, should work with worklets on the UI thread i believe!
}

const Renderer = Reconciler(HostConfig);

global.Render = function (element, container, callback) {
    Renderer.updateContainer(element, container, null, callback); // TODO: maybe skip callback for now?
}