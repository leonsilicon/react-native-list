
  const capturedManager = nativeFabricUIManager;
  
  export function setupWorklet() {
    "worklet";
  global.nativeFabricUIManager = capturedManager;
  var IS_REACT_ACT_ENVIRONMENT = false;
  var reportError = console.error;
  var MessageChannel = undefined;
  var __REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  var AbortController = undefined;

    
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// ../node_modules/@babel/runtime/helpers/interopRequireDefault.js
var require_interopRequireDefault = __commonJS((exports2, module2) => {
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  module2.exports = _interopRequireDefault, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
});

// ../node_modules/react-native/Libraries/Utilities/defineLazyObjectProperty.js
var require_defineLazyObjectProperty = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  function defineLazyObjectProperty(object, name, descriptor) {
    var get = descriptor.get;
    var enumerable = descriptor.enumerable !== false;
    var writable = descriptor.writable !== false;
    var value;
    var valueSet = false;
    function getValue() {
      if (!valueSet) {
        valueSet = true;
        setValue(get());
      }
      return value;
    }
    function setValue(newValue) {
      value = newValue;
      valueSet = true;
      Object.defineProperty(object, name, { value: newValue, configurable: true, enumerable, writable });
    }
    Object.defineProperty(object, name, { get: getValue, set: setValue, configurable: true, enumerable });
  }
  var _default = exports2.default = defineLazyObjectProperty;
});

// ../node_modules/react-native/Libraries/ReactNative/FabricUIManager.js
var require_FabricUIManager = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.getFabricUIManager = getFabricUIManager;
  var _defineLazyObjectProperty = _interopRequireDefault(require_defineLazyObjectProperty());
  var nativeFabricUIManagerProxy;
  var CACHED_PROPERTIES = ["createNode", "cloneNode", "cloneNodeWithNewChildren", "cloneNodeWithNewProps", "cloneNodeWithNewChildrenAndProps", "createChildSet", "appendChild", "appendChildToSet", "completeRoot", "measure", "measureInWindow", "measureLayout", "configureNextLayoutAnimation", "sendAccessibilityEvent", "findShadowNodeByTag_DEPRECATED", "setNativeProps", "dispatchCommand", "compareDocumentPosition", "getBoundingClientRect", "unstable_DefaultEventPriority", "unstable_DiscreteEventPriority", "unstable_ContinuousEventPriority", "unstable_IdleEventPriority", "unstable_getCurrentEventPriority"];
  function getFabricUIManager() {
    if (global.nativeFabricUIManager == null) {
      throw new Error("FabricUIManager is undefined.");
    }
    if (nativeFabricUIManagerProxy == null && global.nativeFabricUIManager != null) {
      nativeFabricUIManagerProxy = createProxyWithCachedProperties(global.nativeFabricUIManager, CACHED_PROPERTIES);
    }
    return nativeFabricUIManagerProxy;
  }
  function createProxyWithCachedProperties(implementation, propertiesToCache) {
    var proxy = Object.create(implementation);
    var _loop = function _loop(propertyName2) {
      (0, _defineLazyObjectProperty.default)(proxy, propertyName2, { get: function get() {
        return implementation[propertyName2];
      } });
    };
    for (var propertyName of propertiesToCache) {
      _loop(propertyName);
    }
    return proxy;
  }
});

// ../node_modules/react-native/Libraries/StyleSheet/flattenStyle.js
var require_flattenStyle = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  function flattenStyle(style) {
    if (style === null || typeof style !== "object") {
      return;
    }
    if (!Array.isArray(style)) {
      return style;
    }
    var result = {};
    for (var i = 0, styleLength = style.length;i < styleLength; ++i) {
      var computedStyle = flattenStyle(style[i]);
      if (computedStyle) {
        for (var key in computedStyle) {
          result[key] = computedStyle[key];
        }
      }
    }
    return result;
  }
  var _default = exports2.default = flattenStyle;
});

// ../node_modules/react-native/Libraries/Utilities/differ/deepDiffer.js
var require_deepDiffer = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  var logListeners;
  function unstable_setLogListeners(listeners) {
    logListeners = listeners;
  }
  function deepDiffer(one, two) {
    var maxDepthOrOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
    var maybeOptions = arguments.length > 3 ? arguments[3] : undefined;
    var options = typeof maxDepthOrOptions === "number" ? maybeOptions : maxDepthOrOptions;
    var maxDepth = typeof maxDepthOrOptions === "number" ? maxDepthOrOptions : -1;
    if (maxDepth === 0) {
      return true;
    }
    if (one === two) {
      return false;
    }
    if (typeof one === "function" && typeof two === "function") {
      var unsafelyIgnoreFunctions = options == null ? undefined : options.unsafelyIgnoreFunctions;
      if (unsafelyIgnoreFunctions == null) {
        if (logListeners && logListeners.onDifferentFunctionsIgnored && (!options || !("unsafelyIgnoreFunctions" in options))) {
          logListeners.onDifferentFunctionsIgnored(one.name, two.name);
        }
        unsafelyIgnoreFunctions = true;
      }
      return !unsafelyIgnoreFunctions;
    }
    if (typeof one !== "object" || one === null) {
      return one !== two;
    }
    if (typeof two !== "object" || two === null) {
      return true;
    }
    if (one.constructor !== two.constructor) {
      return true;
    }
    if (Array.isArray(one)) {
      var len = one.length;
      if (two.length !== len) {
        return true;
      }
      for (var ii = 0;ii < len; ii++) {
        if (deepDiffer(one[ii], two[ii], maxDepth - 1, options)) {
          return true;
        }
      }
    } else {
      for (var key in one) {
        if (deepDiffer(one[key], two[key], maxDepth - 1, options)) {
          return true;
        }
      }
      for (var twoKey in two) {
        if (one[twoKey] === undefined && two[twoKey] !== undefined) {
          return true;
        }
      }
    }
    return false;
  }
  deepDiffer.unstable_setLogListeners = unstable_setLogListeners;
  var _default = exports2.default = deepDiffer;
});

// ../node_modules/react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload.js
var require_ReactNativeAttributePayload = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.create = create;
  exports2.diff = diff;
  var _flattenStyle = _interopRequireDefault(require_flattenStyle());
  var _deepDiffer = _interopRequireDefault(require_deepDiffer());
  var emptyObject = {};
  var removedKeys = null;
  var removedKeyCount = 0;
  var deepDifferOptions = { unsafelyIgnoreFunctions: true };
  function defaultDiffer(prevProp, nextProp) {
    if (typeof nextProp !== "object" || nextProp === null) {
      return true;
    } else {
      return (0, _deepDiffer.default)(prevProp, nextProp, deepDifferOptions);
    }
  }
  function restoreDeletedValuesInNestedArray(updatePayload, node, validAttributes) {
    if (Array.isArray(node)) {
      var i = node.length;
      while (i-- && removedKeyCount > 0) {
        restoreDeletedValuesInNestedArray(updatePayload, node[i], validAttributes);
      }
    } else if (node && removedKeyCount > 0) {
      var obj = node;
      for (var propKey in removedKeys) {
        if (!removedKeys[propKey]) {
          continue;
        }
        var nextProp = obj[propKey];
        if (nextProp === undefined) {
          continue;
        }
        var attributeConfig = validAttributes[propKey];
        if (!attributeConfig) {
          continue;
        }
        if (typeof nextProp === "function") {
          nextProp = true;
        }
        if (typeof nextProp === "undefined") {
          nextProp = null;
        }
        if (typeof attributeConfig !== "object") {
          updatePayload[propKey] = nextProp;
        } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
          var nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
          updatePayload[propKey] = nextValue;
        }
        removedKeys[propKey] = false;
        removedKeyCount--;
      }
    }
  }
  function diffNestedArrayProperty(updatePayload, prevArray, nextArray, validAttributes) {
    var minLength = prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
    var i;
    for (i = 0;i < minLength; i++) {
      updatePayload = diffNestedProperty(updatePayload, prevArray[i], nextArray[i], validAttributes);
    }
    for (;i < prevArray.length; i++) {
      updatePayload = clearNestedProperty(updatePayload, prevArray[i], validAttributes);
    }
    for (;i < nextArray.length; i++) {
      var nextProp = nextArray[i];
      if (!nextProp) {
        continue;
      }
      updatePayload = addNestedProperty(updatePayload, nextProp, validAttributes);
    }
    return updatePayload;
  }
  function diffNestedProperty(updatePayload, prevProp, nextProp, validAttributes) {
    if (!updatePayload && prevProp === nextProp) {
      return updatePayload;
    }
    if (!prevProp || !nextProp) {
      if (nextProp) {
        return addNestedProperty(updatePayload, nextProp, validAttributes);
      }
      if (prevProp) {
        return clearNestedProperty(updatePayload, prevProp, validAttributes);
      }
      return updatePayload;
    }
    if (!Array.isArray(prevProp) && !Array.isArray(nextProp)) {
      return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
    }
    if (Array.isArray(prevProp) && Array.isArray(nextProp)) {
      return diffNestedArrayProperty(updatePayload, prevProp, nextProp, validAttributes);
    }
    if (Array.isArray(prevProp)) {
      return diffProperties(updatePayload, (0, _flattenStyle.default)(prevProp), nextProp, validAttributes);
    }
    return diffProperties(updatePayload, prevProp, (0, _flattenStyle.default)(nextProp), validAttributes);
  }
  function clearNestedProperty(updatePayload, prevProp, validAttributes) {
    if (!prevProp) {
      return updatePayload;
    }
    if (!Array.isArray(prevProp)) {
      return clearProperties(updatePayload, prevProp, validAttributes);
    }
    for (var i = 0;i < prevProp.length; i++) {
      updatePayload = clearNestedProperty(updatePayload, prevProp[i], validAttributes);
    }
    return updatePayload;
  }
  function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
    var attributeConfig;
    var nextProp;
    var prevProp;
    for (var propKey in nextProps) {
      attributeConfig = validAttributes[propKey];
      if (!attributeConfig) {
        continue;
      }
      prevProp = prevProps[propKey];
      nextProp = nextProps[propKey];
      if (typeof nextProp === "function") {
        var attributeConfigHasProcess = typeof attributeConfig === "object" && typeof attributeConfig.process === "function";
        if (!attributeConfigHasProcess) {
          nextProp = true;
          if (typeof prevProp === "function") {
            prevProp = true;
          }
        }
      }
      if (typeof nextProp === "undefined") {
        nextProp = null;
        if (typeof prevProp === "undefined") {
          prevProp = null;
        }
      }
      if (removedKeys) {
        removedKeys[propKey] = false;
      }
      if (updatePayload && updatePayload[propKey] !== undefined) {
        if (typeof attributeConfig !== "object") {
          updatePayload[propKey] = nextProp;
        } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
          var nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
          updatePayload[propKey] = nextValue;
        }
        continue;
      }
      if (prevProp === nextProp) {
        continue;
      }
      if (typeof attributeConfig !== "object") {
        if (defaultDiffer(prevProp, nextProp)) {
          (updatePayload || (updatePayload = {}))[propKey] = nextProp;
        }
      } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
        var shouldUpdate = prevProp === undefined || (typeof attributeConfig.diff === "function" ? attributeConfig.diff(prevProp, nextProp) : defaultDiffer(prevProp, nextProp));
        if (shouldUpdate) {
          var _nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
          (updatePayload || (updatePayload = {}))[propKey] = _nextValue;
        }
      } else {
        removedKeys = null;
        removedKeyCount = 0;
        updatePayload = diffNestedProperty(updatePayload, prevProp, nextProp, attributeConfig);
        if (removedKeyCount > 0 && updatePayload) {
          restoreDeletedValuesInNestedArray(updatePayload, nextProp, attributeConfig);
          removedKeys = null;
        }
      }
    }
    for (var _propKey in prevProps) {
      if (nextProps[_propKey] !== undefined) {
        continue;
      }
      attributeConfig = validAttributes[_propKey];
      if (!attributeConfig) {
        continue;
      }
      if (updatePayload && updatePayload[_propKey] !== undefined) {
        continue;
      }
      prevProp = prevProps[_propKey];
      if (prevProp === undefined) {
        continue;
      }
      if (typeof attributeConfig !== "object" || typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
        (updatePayload || (updatePayload = {}))[_propKey] = null;
        if (!removedKeys) {
          removedKeys = {};
        }
        if (!removedKeys[_propKey]) {
          removedKeys[_propKey] = true;
          removedKeyCount++;
        }
      } else {
        updatePayload = clearNestedProperty(updatePayload, prevProp, attributeConfig);
      }
    }
    return updatePayload;
  }
  function addNestedProperty(payload, props, validAttributes) {
    if (Array.isArray(props)) {
      for (var i = 0;i < props.length; i++) {
        payload = addNestedProperty(payload, props[i], validAttributes);
      }
      return payload;
    }
    for (var propKey in props) {
      var prop = props[propKey];
      var attributeConfig = validAttributes[propKey];
      if (attributeConfig == null) {
        continue;
      }
      var newValue = undefined;
      if (prop === undefined) {
        if (payload && payload[propKey] !== undefined) {
          newValue = null;
        } else {
          continue;
        }
      } else if (typeof attributeConfig === "object") {
        if (typeof attributeConfig.process === "function") {
          newValue = attributeConfig.process(prop);
        } else if (typeof attributeConfig.diff === "function") {
          newValue = prop;
        }
      } else {
        if (typeof prop === "function") {
          newValue = true;
        } else {
          newValue = prop;
        }
      }
      if (newValue !== undefined) {
        if (!payload) {
          payload = {};
        }
        payload[propKey] = newValue;
        continue;
      }
      payload = addNestedProperty(payload, prop, attributeConfig);
    }
    return payload;
  }
  function clearProperties(updatePayload, prevProps, validAttributes) {
    return diffProperties(updatePayload, prevProps, emptyObject, validAttributes);
  }
  function create(props, validAttributes) {
    return addNestedProperty(null, props, validAttributes);
  }
  function diff(prevProps, nextProps, validAttributes) {
    return diffProperties(null, prevProps, nextProps, validAttributes);
  }
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/EventPluginRegistry.js
var require_EventPluginRegistry = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.eventNameDispatchConfigs = undefined;
  exports2.injectEventPluginOrder = injectEventPluginOrder;
  exports2.injectEventPluginsByName = injectEventPluginsByName;
  exports2.registrationNameModules = exports2.registrationNameDependencies = exports2.possibleRegistrationNames = exports2.plugins = undefined;
  var eventPluginOrder = null;
  var namesToPlugins = {};
  function recomputePluginOrdering() {
    if (!eventPluginOrder) {
      return;
    }
    for (var pluginName in namesToPlugins) {
      var pluginModule = namesToPlugins[pluginName];
      var pluginIndex = eventPluginOrder.indexOf(pluginName);
      if (pluginIndex <= -1) {
        throw new Error("EventPluginRegistry: Cannot inject event plugins that do not exist in " + `the plugin ordering, \`${pluginName}\`.`);
      }
      if (plugins[pluginIndex]) {
        continue;
      }
      if (!pluginModule.extractEvents) {
        throw new Error("EventPluginRegistry: Event plugins must implement an `extractEvents` " + `method, but \`${pluginName}\` does not.`);
      }
      plugins[pluginIndex] = pluginModule;
      var publishedEvents = pluginModule.eventTypes;
      for (var _eventName in publishedEvents) {
        if (!publishEventForPlugin(publishedEvents[_eventName], pluginModule, _eventName)) {
          throw new Error(`EventPluginRegistry: Failed to publish event \`${_eventName}\` for plugin \`${pluginName}\`.`);
        }
      }
    }
  }
  function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
    if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
      throw new Error("EventPluginRegistry: More than one plugin attempted to publish the same " + `event name, \`${eventName}\`.`);
    }
    eventNameDispatchConfigs[eventName] = dispatchConfig;
    var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
    if (phasedRegistrationNames) {
      for (var phaseName in phasedRegistrationNames) {
        if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
          var phasedRegistrationName = phasedRegistrationNames[phaseName];
          publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
        }
      }
      return true;
    } else if (dispatchConfig.registrationName) {
      publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName);
      return true;
    }
    return false;
  }
  function publishRegistrationName(registrationName, pluginModule, eventName) {
    if (registrationNameModules[registrationName]) {
      throw new Error("EventPluginRegistry: More than one plugin attempted to publish the same " + `registration name, \`${registrationName}\`.`);
    }
    registrationNameModules[registrationName] = pluginModule;
    registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;
    if (__DEV__) {
      var _lowerCasedName = registrationName.toLowerCase();
      possibleRegistrationNames[_lowerCasedName] = registrationName;
      if (registrationName === "onDoubleClick") {
        possibleRegistrationNames.ondblclick = registrationName;
      }
    }
  }
  var plugins = exports2.plugins = [];
  var eventNameDispatchConfigs = exports2.eventNameDispatchConfigs = {};
  var registrationNameModules = exports2.registrationNameModules = {};
  var registrationNameDependencies = exports2.registrationNameDependencies = {};
  var possibleRegistrationNames = exports2.possibleRegistrationNames = __DEV__ ? {} : null;
  function injectEventPluginOrder(injectedEventPluginOrder) {
    if (eventPluginOrder) {
      throw new Error("EventPluginRegistry: Cannot inject event plugin ordering more than " + "once. You are likely trying to load more than one copy of React.");
    }
    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
  }
  function injectEventPluginsByName(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var pluginModule = injectedNamesToPlugins[pluginName];
      if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
        if (namesToPlugins[pluginName]) {
          throw new Error("EventPluginRegistry: Cannot inject two different event plugins " + `using the same name, \`${pluginName}\`.`);
        }
        namesToPlugins[pluginName] = pluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  }
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/ReactGenericBatching.js
var require_ReactGenericBatching = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.batchedUpdates = batchedUpdates;
  exports2.discreteUpdates = discreteUpdates;
  exports2.setBatchingImplementation = setBatchingImplementation;
  var batchedUpdatesImpl = function batchedUpdatesImpl(fn, bookkeeping) {
    return fn(bookkeeping);
  };
  var discreteUpdatesImpl = function discreteUpdatesImpl(fn, a, b, c, d) {
    return fn(a, b, c, d);
  };
  var isInsideEventHandler = false;
  function batchedUpdates(fn, bookkeeping) {
    if (isInsideEventHandler) {
      return fn(bookkeeping);
    }
    isInsideEventHandler = true;
    try {
      return batchedUpdatesImpl(fn, bookkeeping);
    } finally {
      isInsideEventHandler = false;
    }
  }
  function discreteUpdates(fn, a, b, c, d) {
    var prevIsInsideEventHandler = isInsideEventHandler;
    isInsideEventHandler = true;
    try {
      return discreteUpdatesImpl(fn, a, b, c, d);
    } finally {
      isInsideEventHandler = prevIsInsideEventHandler;
    }
  }
  function setBatchingImplementation(_batchedUpdatesImpl, _discreteUpdatesImpl) {
    batchedUpdatesImpl = _batchedUpdatesImpl;
    discreteUpdatesImpl = _discreteUpdatesImpl;
  }
});

// ../third_party/react/packages/shared/isArray.js
var require_isArray = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  var isArrayImpl = Array.isArray;
  function isArray(a) {
    return isArrayImpl(a);
  }
  var _default = exports2.default = isArray;
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/accumulateInto.js
var require_accumulateInto = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  var _isArray = _interopRequireDefault(require_isArray());
  function accumulateInto(current, next) {
    if (next == null) {
      throw new Error("Accumulated items must not be null or undefined.");
    }
    if (current == null) {
      return next;
    }
    if ((0, _isArray.default)(current)) {
      if ((0, _isArray.default)(next)) {
        current.push.apply(current, next);
        return current;
      }
      current.push(next);
      return current;
    }
    if ((0, _isArray.default)(next)) {
      return [current].concat(next);
    }
    return [current, next];
  }
  var _default = exports2.default = accumulateInto;
});

// shims/react-current-fiber.js
var require_react_current_fiber = __commonJS((exports2, module2) => {
  function runWithFiberInDEV(_fiber, fn, ...args) {
    return fn(...args);
  }
  module2.exports = {
    runWithFiberInDEV
  };
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/EventPluginUtils.js
var require_EventPluginUtils = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.executeDirectDispatch = executeDirectDispatch;
  exports2.executeDispatch = executeDispatch;
  exports2.executeDispatchesInOrder = executeDispatchesInOrder;
  exports2.executeDispatchesInOrderStopAtTrue = executeDispatchesInOrderStopAtTrue;
  exports2.getNodeFromInstance = exports2.getInstanceFromNode = exports2.getFiberCurrentPropsFromNode = undefined;
  exports2.hasDispatches = hasDispatches;
  exports2.rethrowCaughtError = rethrowCaughtError;
  exports2.setComponentTree = setComponentTree;
  var _isArray = _interopRequireDefault(require_isArray());
  var _ReactCurrentFiber = require_react_current_fiber();
  var hasError = false;
  var caughtError = null;
  var getFiberCurrentPropsFromNode = exports2.getFiberCurrentPropsFromNode = null;
  var getInstanceFromNode = exports2.getInstanceFromNode = null;
  var getNodeFromInstance = exports2.getNodeFromInstance = null;
  function setComponentTree(getFiberCurrentPropsFromNodeImpl, getInstanceFromNodeImpl, getNodeFromInstanceImpl) {
    exports2.getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
    exports2.getInstanceFromNode = getInstanceFromNode = getInstanceFromNodeImpl;
    exports2.getNodeFromInstance = getNodeFromInstance = getNodeFromInstanceImpl;
    if (__DEV__) {
      if (!getNodeFromInstance || !getInstanceFromNode) {
        console.error("Injected " + "module is missing getNodeFromInstance or getInstanceFromNode.");
      }
    }
  }
  function validateEventDispatches(event) {
    if (__DEV__) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;
      var listenersIsArr = (0, _isArray.default)(dispatchListeners);
      var listenersLen = listenersIsArr ? dispatchListeners.length : dispatchListeners ? 1 : 0;
      var instancesIsArr = (0, _isArray.default)(dispatchInstances);
      var instancesLen = instancesIsArr ? dispatchInstances.length : dispatchInstances ? 1 : 0;
      if (instancesIsArr !== listenersIsArr || instancesLen !== listenersLen) {
        console.error("EventPluginUtils: Invalid `event`.");
      }
    }
  }
  function executeDispatch(event, listener, inst) {
    event.currentTarget = getNodeFromInstance(inst);
    try {
      listener(event);
    } catch (error) {
      if (!hasError) {
        hasError = true;
        caughtError = error;
      } else {}
    }
    event.currentTarget = null;
  }
  function executeDispatchesInOrder(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;
    if (__DEV__) {
      validateEventDispatches(event);
    }
    if ((0, _isArray.default)(dispatchListeners)) {
      for (var i = 0;i < dispatchListeners.length; i++) {
        if (event.isPropagationStopped()) {
          break;
        }
        var listener = dispatchListeners[i];
        var instance = dispatchInstances[i];
        if (__DEV__ && instance !== null) {
          (0, _ReactCurrentFiber.runWithFiberInDEV)(instance, executeDispatch, event, listener, instance);
        } else {
          executeDispatch(event, listener, instance);
        }
      }
    } else if (dispatchListeners) {
      var _listener = dispatchListeners;
      var _instance = dispatchInstances;
      if (__DEV__ && _instance !== null) {
        (0, _ReactCurrentFiber.runWithFiberInDEV)(_instance, executeDispatch, event, _listener, _instance);
      } else {
        executeDispatch(event, _listener, _instance);
      }
    }
    event._dispatchListeners = null;
    event._dispatchInstances = null;
  }
  function executeDispatchesInOrderStopAtTrueImpl(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;
    if (__DEV__) {
      validateEventDispatches(event);
    }
    if ((0, _isArray.default)(dispatchListeners)) {
      for (var i = 0;i < dispatchListeners.length; i++) {
        if (event.isPropagationStopped()) {
          break;
        }
        if (dispatchListeners[i](event, dispatchInstances[i])) {
          return dispatchInstances[i];
        }
      }
    } else if (dispatchListeners) {
      if (dispatchListeners(event, dispatchInstances)) {
        return dispatchInstances;
      }
    }
    return null;
  }
  function executeDispatchesInOrderStopAtTrue(event) {
    var ret = executeDispatchesInOrderStopAtTrueImpl(event);
    event._dispatchInstances = null;
    event._dispatchListeners = null;
    return ret;
  }
  function executeDirectDispatch(event) {
    if (__DEV__) {
      validateEventDispatches(event);
    }
    var dispatchListener = event._dispatchListeners;
    var dispatchInstance = event._dispatchInstances;
    if ((0, _isArray.default)(dispatchListener)) {
      throw new Error("Invalid `event`.");
    }
    event.currentTarget = dispatchListener ? getNodeFromInstance(dispatchInstance) : null;
    var res = dispatchListener ? dispatchListener(event) : null;
    event.currentTarget = null;
    event._dispatchListeners = null;
    event._dispatchInstances = null;
    return res;
  }
  function hasDispatches(event) {
    return !!event._dispatchListeners;
  }
  function rethrowCaughtError() {
    if (hasError) {
      var error = caughtError;
      hasError = false;
      caughtError = null;
      throw error;
    }
  }
});

// ../third_party/react/packages/react-native-renderer/src/ReactNativeGetListener.js
var require_ReactNativeGetListener = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = getListener;
  var _EventPluginUtils = require_EventPluginUtils();
  function getListener(inst, registrationName) {
    var stateNode = inst.stateNode;
    if (stateNode === null) {
      return null;
    }
    var props = (0, _EventPluginUtils.getFiberCurrentPropsFromNode)(stateNode);
    if (props === null) {
      return null;
    }
    var listener = props[registrationName];
    if (listener && typeof listener !== "function") {
      throw new Error(`Expected \`${registrationName}\` listener to be a function, instead got a value of \`${typeof listener}\` type.`);
    }
    return listener;
  }
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/forEachAccumulated.js
var require_forEachAccumulated = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.default = undefined;
  function forEachAccumulated(arr, cb, scope) {
    if (Array.isArray(arr)) {
      arr.forEach(cb, scope);
    } else if (arr) {
      cb.call(scope, arr);
    }
  }
  var _default = exports2.default = forEachAccumulated;
});

// ../third_party/react/packages/react-native-renderer/src/legacy-events/EventBatching.js
var require_EventBatching = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.runEventsInBatch = runEventsInBatch;
  var _accumulateInto = _interopRequireDefault(require_accumulateInto());
  var _forEachAccumulated = _interopRequireDefault(require_forEachAccumulated());
  var _EventPluginUtils = require_EventPluginUtils();
  var eventQueue = null;
  function executeDispatchesAndRelease(event) {
    if (event) {
      (0, _EventPluginUtils.executeDispatchesInOrder)(event);
      if (!event.isPersistent()) {
        event.constructor.release(event);
      }
    }
  }
  function executeDispatchesAndReleaseTopLevel(e) {
    return executeDispatchesAndRelease(e);
  }
  function runEventsInBatch(events) {
    if (events !== null) {
      eventQueue = (0, _accumulateInto.default)(eventQueue, events);
    }
    var processingEventQueue = eventQueue;
    eventQueue = null;
    if (!processingEventQueue) {
      return;
    }
    (0, _forEachAccumulated.default)(processingEventQueue, executeDispatchesAndReleaseTopLevel);
    if (eventQueue) {
      throw new Error("processEventQueue(): Additional events were enqueued while processing " + "an event queue. Support for this has not yet been implemented.");
    }
    (0, _EventPluginUtils.rethrowCaughtError)();
  }
});

// shims/react-fiber-config-fabric.js
var require_react_fiber_config_fabric = __commonJS((exports2, module2) => {
  var ReactNativeElementModule = require("react-native/src/private/webapis/dom/nodes/ReactNativeElement");
  var ReactNativeElement = ReactNativeElementModule?.default ?? ReactNativeElementModule;
  function getPublicInstance(instance) {
    if (instance?.canonical != null) {
      if (instance.canonical.publicInstance == null) {
        instance.canonical.publicInstance = new ReactNativeElement(instance.canonical.nativeTag, instance.canonical.viewConfig, instance.canonical.internalInstanceHandle, instance.canonical.publicRootInstance ?? null);
        instance.canonical.publicRootInstance = null;
      }
      return instance.canonical.publicInstance;
    }
    if (instance?.containerInfo?.publicInstance != null) {
      return instance.containerInfo.publicInstance;
    }
    if (instance?._nativeTag != null) {
      return instance;
    }
    return null;
  }
  module2.exports = {
    getPublicInstance
  };
});

// ../third_party/react/packages/react-native-renderer/src/ReactFabricEventEmitter.js
var require_ReactFabricEventEmitter = __commonJS((exports2) => {
  var _interopRequireDefault = require_interopRequireDefault();
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.dispatchEvent = dispatchEvent;
  Object.defineProperty(exports2, "getListener", { enumerable: true, get: function get() {
    return _ReactNativeGetListener.default;
  } });
  Object.defineProperty(exports2, "registrationNames", { enumerable: true, get: function get() {
    return _EventPluginRegistry.registrationNameModules;
  } });
  var _EventPluginRegistry = require_EventPluginRegistry();
  var _ReactGenericBatching = require_ReactGenericBatching();
  var _accumulateInto = _interopRequireDefault(require_accumulateInto());
  var _ReactNativeGetListener = _interopRequireDefault(require_ReactNativeGetListener());
  var _EventBatching = require_EventBatching();
  var _ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
  var _ReactFiberConfigFabric = require_react_fiber_config_fabric();
  function extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events = null;
    var legacyPlugins = _EventPluginRegistry.plugins;
    for (var i = 0;i < legacyPlugins.length; i++) {
      var possiblePlugin = legacyPlugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
        if (extractedEvents) {
          events = (0, _accumulateInto.default)(events, extractedEvents);
        }
      }
    }
    return events;
  }
  function runExtractedPluginEventsInBatch(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events = extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    (0, _EventBatching.runEventsInBatch)(events);
  }
  function dispatchEvent(target, topLevelType, nativeEvent) {
    var targetFiber = target;
    var eventTarget = null;
    if (targetFiber != null) {
      var stateNode = targetFiber.stateNode;
      if (stateNode != null) {
        eventTarget = (0, _ReactFiberConfigFabric.getPublicInstance)(stateNode);
      }
    }
    (0, _ReactGenericBatching.batchedUpdates)(function() {
      var event = { eventName: topLevelType, nativeEvent };
      _ReactNativePrivateInterface.RawEventEmitter.emit(topLevelType, event);
      _ReactNativePrivateInterface.RawEventEmitter.emit("*", event);
      runExtractedPluginEventsInBatch(topLevelType, targetFiber, nativeEvent, eventTarget);
    });
  }
  console.warn("Deep imports from the 'react-native' package are deprecated ('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface'). Source: /Users/hannogodecke/Documents/react-native-nitro-list/third_party/react/packages/react-native-renderer/src/ReactFabricEventEmitter.js 31:0");
});

// src/ReactFabricMirror.js
var Reconciler = require("react-reconciler");
var {
  getFabricUIManager
} = require_FabricUIManager();
var uiManager = getFabricUIManager();
console.log("[ReactFabricMirror] got FabricUIManager:", uiManager);
var {
  create: createAttributePayload,
  diff: diffAttributePayloads
} = require_ReactNativeAttributePayload();
var ReactNativeViewConfigRegistry = require("react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry");
global.rootHostContext = {};
global.childHostContext = {};
var {
  NoEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  IdleEventPriority
} = require("react-reconciler/constants");
global.currentUpdatePriority = NoEventPriority;
global.rootInstance = {
  containerTag: 3,
  publicInstance: null
};
var { dispatchEvent } = require_ReactFabricEventEmitter();
global.handleEvent = dispatchEvent;
var { getPublicInstance } = require_react_fiber_config_fabric();
function log(...args) {
  global._log?.("[ReactFabricMirror] " + args.map((a) => {
    try {
      return JSON.stringify(a);
    } catch (e) {
      return String(a);
    }
  }).join(" "));
}
global.log = log;
global.nextReactTag = 2;
var HostConfig = {
  now: performance.now,
  getRootHostContext(rootContainerInstance) {
    return global.rootHostContext;
  },
  getChildHostContext() {
    return global.childHostContext;
  },
  supportsPersistence: true,
  createInstance: (type, props, rootContainerInstance, _currentHostContext, workInProgress) => {
    const tag = global.nextReactTag;
    global.nextReactTag += 2;
    const viewConfig = ReactNativeViewConfigRegistry.get(type);
    const updatePayload = createAttributePayload(props, viewConfig.validAttributes);
    let node;
    try {
      log("[createInstance] calling createNode with type=", type, "tag=", tag);
      log("[createInstance] props=", updatePayload);
      node = uiManager.createNode(tag, viewConfig.uiViewClassName, rootContainerInstance.containerTag, updatePayload, workInProgress);
    } catch (e) {
      log("[createInstance] ERROR in createNode:", e.message || String(e));
      log("Stack:", new Error().stack);
      throw e;
    }
    return {
      node,
      canonical: {
        nativeTag: tag,
        viewConfig,
        currentProps: props,
        internalInstanceHandle: workInProgress,
        publicInstance: null,
        publicRootInstance: rootContainerInstance.publicInstance
      }
    };
  },
  finalizeInitialChildren(parentInstance, type, props, hostContext) {
    log("[finalizeInitialChildren]");
    return false;
  },
  cloneInstance(instance, type, oldProps, newProps, keepChildren, newChildSet) {
    log("[cloneInstance] tag=", instance.canonical.nativeTag);
    const viewConfig = instance.canonical.viewConfig;
    const updatePayload = diffAttributePayloads(oldProps, newProps, viewConfig.validAttributes);
    log("[cloneInstance] updatePayload=", updatePayload);
    instance.canonical.currentProps = newProps;
    const node = instance.node;
    let clone;
    if (keepChildren) {
      if (updatePayload !== null) {
        clone = uiManager.cloneNodeWithNewProps(node, updatePayload);
      } else {
        return instance;
      }
    } else {
      if (newChildSet != null) {
        if (updatePayload !== null) {
          clone = uiManager.cloneNodeWithNewChildrenAndProps(node, newChildSet, updatePayload);
        } else {
          clone = uiManager.cloneNodeWithNewChildren(node, newChildSet);
        }
      } else {
        if (updatePayload !== null) {
          clone = uiManager.cloneNodeWithNewChildrenAndProps(node, updatePayload);
        } else {
          clone = uiManager.cloneNodeWithNewChildren(node);
        }
      }
    }
    return {
      node: clone,
      canonical: instance.canonical
    };
  },
  createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    const tag = global.nextReactTag;
    global.nextReactTag += 2;
    const node = uiManager.createNode(tag, "RCTRawText", rootContainerInstance.containerTag, { text }, internalInstanceHandle);
    return {
      node
    };
  },
  createContainerChildSet() {
    log("[createContainerChildSet]");
    return uiManager.createChildSet();
  },
  appendChildToContainerChildSet(childSet, child) {
    log("[appendChildToContainerChildSet]");
    uiManager.appendChildToSet(childSet, child.node);
  },
  finalizeContainerChildren(container, newChildren) {
    log("[finalizeContainerChildren]");
  },
  appendInitialChild(parentInstance, child) {
    log("[appendInitialChild]");
    uiManager.appendChild(parentInstance.node, child.node);
  },
  replaceContainerChildren(container, newChildren) {
    log("[replaceContainerChildren]");
    uiManager.completeRoot(container.containerTag, newChildren);
  },
  setCurrentUpdatePriority(priority) {
    global.currentUpdatePriority = priority;
  },
  getCurrentUpdatePriority() {
    return global.currentUpdatePriority;
  },
  resolveUpdatePriority() {
    if (global.currentUpdatePriority !== NoEventPriority) {
      return global.currentUpdatePriority;
    } else {
      return DefaultEventPriority;
    }
  },
  getPublicInstance(instance) {
    return getPublicInstance(instance);
  },
  prepareForCommit(containerInfo) {
    return null;
  },
  resetAfterCommit(containerInfo) {},
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
  shouldSetTextContent(type, props) {
    return false;
  },
  supportsMicrotasks: false,
  detachDeletedInstance(node) {},
  beforeActiveInstanceBlur(internalInstanceHandle) {},
  afterActiveInstanceBlur() {},
  preparePortalMount(portalInstance) {},
  detachDeletedInstance(node) {},
  requestPostPaintCallback(callback) {},
  maySuspendCommit(type, props) {
    return false;
  },
  maySuspendCommitOnUpdate(type, oldProps, newProps) {
    return false;
  },
  maySuspendCommitInSyncRender(type, props) {
    return false;
  },
  preloadInstance(instance, type, props) {
    return true;
  },
  startSuspendingCommit() {
    return null;
  },
  suspendInstance(state, instance, type, props) {},
  suspendOnActiveViewTransition(state, container) {},
  waitForCommitToBeReady(state, timeoutOffset) {
    return null;
  },
  getSuspendedCommitReason(state, rootContainer) {
    return null;
  },
  isPrimaryRenderer: false
};
var Renderer = Reconciler(HostConfig);
global.React = require("react");
global.Render = function(element, callback) {
  if (!global.rootContainer) {
    global.rootContainer = Renderer.createContainer(global.rootInstance, 0, null, false, null, "ui-renderer", function onUncaughtError(error, info) {
      console.error("[ReactFabricMirror] Uncaught error in React renderer: ", error, info);
    }, function onCaughtError(error, info) {
      console.error("[ReactFabricMirror] Caught error in React renderer: ", error, info);
    }, function onRecoverableError(error, info) {
      console.error("[ReactFabricMirror] Recoverable error in React renderer: ", error, info);
    }, function nativeOnDefaultTransitionIndicator() {});
  }
  Renderer.updateContainerSync(element, global.rootContainer, null, callback);
  Renderer.flushSyncWork();
  log("[ReactFabricMirror] updateContainer finished");
};
log("[ReactFabricMirror] ReactFabricMirror initialized");

}
