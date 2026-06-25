#import "TurboModuleInstaller.h"
#import "SurfacePresenterRegistry.h"
#import "WorkletsUiCallInvoker.hpp"
#import "ErrorUtils.h"
#import "HybridUiManagerHelper.hpp"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTBridgeProxy+Cxx.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceHostingView.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <worklets/apple/AssertJavaScriptQueue.h>
#import <worklets/apple/WorkletsModule.h>
#import <NitroModules/NitroLogger.hpp>

#include <jsi/jsi.h>
#include <react/utils/jsi-utils.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/ManagedObjectWrapper.h>

using namespace facebook;
using namespace facebook::react;
using namespace worklets;

namespace {

static RCTTurboModuleManager *sUiTurboModuleManager = nil;
static uint64_t sInstalledRuntimeId = 0;
static BOOL sHasInstalledRuntime = NO;
static std::shared_ptr<facebook::react::CallInvoker> uiCallInvoker = nullptr;

} // namespace

// Private bridge-recovery helpers used under bridgeless / new-arch (Expo SDK 56), where
// `[RCTBridge currentBridge]` is nil and RN never auto-instantiates our registry module.
@interface TurboModuleInstaller (BridgelessRecovery)
+ (nullable id)recoverBridgeProxyFromKeyWindow;
+ (nullable RCTSurfacePresenter *)findSurfacePresenterInView:(nullable UIView *)view;
@end

@interface HybridWorkletsModuleProxyHolderBox ()

- (instancetype)initWithWorkletsModuleProxy:(std::shared_ptr<WorkletsModuleProxy>)workletsModuleProxy;
- (std::shared_ptr<WorkletsModuleProxy>)workletsModuleProxy;

@end

@implementation HybridWorkletsModuleProxyHolderBox {
  std::shared_ptr<WorkletsModuleProxy> _workletsModuleProxy;
}

- (instancetype)initWithWorkletsModuleProxy:(std::shared_ptr<WorkletsModuleProxy>)workletsModuleProxy
{
  self = [super init];
  if (self != nil) {
    _workletsModuleProxy = std::move(workletsModuleProxy);
  }
  return self;
}

- (std::shared_ptr<WorkletsModuleProxy>)workletsModuleProxy
{
  return _workletsModuleProxy;
}

@end

@implementation TurboModuleInstaller

// Walk the app's window hierarchy to find a live `RCTSurfacePresenter` and recover the
// `RCTBridgeProxy` RN stashed in its `contextContainer` (key "RCTBridgeProxy", see RN
// `RCTInstance.mm`). This is our last-resort bridge handle under bridgeless / new-arch where
// `[RCTBridge currentBridge]` is nil and RN never auto-instantiates our registry module (so its
// `setBridge:` never fired). A surface is always mounted by the time any list JS runs, so a
// presenter is reachable from the mounted `RCTSurfaceHostingView`.
+ (nullable id)recoverSurfacePresenterFromKeyWindow
{
  // Walking the UIView hierarchy must happen on the main thread; callers may be on the JS queue, so
  // hop to main synchronously to find the presenter.
  __block RCTSurfacePresenter *presenter = nil;
  void (^findBlock)(void) = ^{
    presenter = [self findSurfacePresenterInView:RCTKeyWindow()];
    if (presenter == nil) {
      // Fall back to scanning every window (key window may not host the RN surface).
      for (UIWindow *window in RCTSharedApplication().windows) {
        presenter = [self findSurfacePresenterInView:window];
        if (presenter != nil) {
          break;
        }
      }
    }
  };
  if ([NSThread isMainThread]) {
    findBlock();
  } else {
    dispatch_sync(dispatch_get_main_queue(), findBlock);
  }
  if (presenter == nil) {
    return nil;
  }

  // Publish the presenter into the registry so every consumer that reads `+currentSurfacePresenter`
  // (this installer, SurfaceHelper) works even though RN never injected it.
  [SurfacePresenterRegistry setCurrentSurfacePresenter:presenter];
  return presenter;
}

// Walk the app's window hierarchy to find a live `RCTSurfacePresenter` and recover the
// `RCTBridgeProxy` RN stashed in its `contextContainer` (key "RCTBridgeProxy", see RN
// `RCTInstance.mm`). This is our last-resort bridge handle under bridgeless / new-arch where
// `[RCTBridge currentBridge]` is nil and RN never auto-instantiates our registry module (so its
// `setBridge:` never fired). A surface is always mounted by the time any list JS runs, so a
// presenter is reachable from the mounted `RCTSurfaceHostingView`.
+ (nullable id)recoverBridgeProxyFromKeyWindow
{
  RCTSurfacePresenter *presenter = (RCTSurfacePresenter *)[self recoverSurfacePresenterFromKeyWindow];
  if (presenter == nil) {
    return nil;
  }

  std::shared_ptr<const facebook::react::ContextContainer> contextContainer = presenter.contextContainer;
  if (contextContainer == nullptr) {
    return nil;
  }
  std::optional<std::shared_ptr<void>> wrapped =
      contextContainer->find<std::shared_ptr<void>>("RCTBridgeProxy");
  if (!wrapped.has_value() || *wrapped == nullptr) {
    return nil;
  }
  id bridgeProxy = facebook::react::unwrapManagedObject(*wrapped);
  return bridgeProxy;
}

// Depth-first search for a view holding an `RCTSurfacePresenter`. `RCTSurfaceHostingView` exposes its
// `surface` publicly; the surface keeps its presenter in the private `_surfacePresenter` ivar
// (reachable via KVC). Headers are stripped/minified in this distribution, so we go through public
// selectors + KVC rather than importing `RCTFabricSurface.h`.
+ (nullable RCTSurfacePresenter *)findSurfacePresenterInView:(nullable UIView *)view
{
  if (view == nil) {
    return nil;
  }
  if ([view isKindOfClass:[RCTSurfaceHostingView class]]) {
    id<RCTSurfaceProtocol> surface = ((RCTSurfaceHostingView *)view).surface;
    if (surface != nil && [surface respondsToSelector:@selector(valueForKey:)]) {
      @try {
        id presenter = [(id)surface valueForKey:@"surfacePresenter"];
        if ([presenter isKindOfClass:[RCTSurfacePresenter class]]) {
          return (RCTSurfacePresenter *)presenter;
        }
      } @catch (__unused NSException *e) {
        // KVC key absent in this RN version — keep searching.
      }
    }
  }
  for (UIView *subview in view.subviews) {
    RCTSurfacePresenter *found = [self findSurfacePresenterInView:subview];
    if (found != nil) {
      return found;
    }
  }
  return nil;
}

+ (nullable HybridWorkletsModuleProxyHolderBox *)createWorkletsModuleProxyHolder:
    (NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
    // `[RCTBridge currentBridge]` is nil under bridgeless / new-arch (Expo SDK 56). The registry's
    // `setBridge:` (capturing the bridge proxy) only fires once RN instantiates the registry module,
    // which it never does on its own under the new arch. So if the bridge isn't captured yet, recover
    // it from a live `RCTSurfacePresenter`'s `contextContainer["RCTBridgeProxy"]` (see RN
    // `RCTInstance.mm` — it stores the bridge proxy there). The surface presenter is reachable from
    // the mounted root view in the key window.
    RCTBridge *bridge = [RCTBridge currentBridge] ?: (RCTBridge *)[SurfacePresenterRegistry currentBridge];
    if (bridge == nil) {
      bridge = (RCTBridge *)[self recoverBridgeProxyFromKeyWindow];
    }
    if (bridge == nil) {
      id sp = [SurfacePresenterRegistry currentSurfacePresenter];
      assignError(error, [NSString stringWithFormat:@"[bridgeless-patch] no bridge: currentBridge nil, registry bridge nil, keyWindow recovery nil; registry surfacePresenter=%@.", sp]);
      return nil;
    }

    if (!IsJavaScriptQueue()) {
      assignError(error, @"iosGetWorkletsModule() must run on the JavaScript queue.");
      return nil;
    }

    // Prime the registry module while we're on the JS queue.
    id registryModule = [bridge moduleForClass:SurfacePresenterRegistry.class];
    if (registryModule == nil) {
      assignError(error, @"Could not initialize HybridUiListSurfacePresenterRegistry.");
      return nil;
    }
    if ([SurfacePresenterRegistry currentSurfacePresenter] == nil) {
      assignError(error, @"SurfacePresenter was not injected into HybridUiListSurfacePresenterRegistry.");
      return nil;
    }

    WorkletsModule *workletsModule = [bridge moduleForClass:WorkletsModule.class];
    if (workletsModule == nil) {
      assignError(error, @"WorkletsModule is not available from the bridge.");
      return nil;
    }

    std::shared_ptr<WorkletsModuleProxy> workletsModuleProxy = [workletsModule getWorkletsModuleProxy];
    if (workletsModuleProxy == nullptr) {
      assignError(error, @"Could not access WorkletsModuleProxy.");
      return nil;
    }

    return [[HybridWorkletsModuleProxyHolderBox alloc] initWithWorkletsModuleProxy:std::move(workletsModuleProxy)];
  } @catch (NSException *exception) {
    assignError(error, [NSString stringWithFormat:@"Failed to create WorkletsModuleProxy holder: %@", exception.reason]);
    return nil;
  }
}

+ (BOOL)installNativeModuleProxyInUIRuntimeWithHolder:(HybridWorkletsModuleProxyHolderBox *)holder
                                                 error:(NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
      margelo::nitro::Logger::log(margelo::nitro::LogLevel::Debug, "TurboModuleInstaller", "installNativeModuleProxyInUIRuntime()");
    if (holder == nil) {
      assignError(error, @"Expected non-null IOSWorkletsModuleProxyHolder.");
      return NO;
    }

    std::shared_ptr<WorkletsModuleProxy> workletsModuleProxy = [holder workletsModuleProxy];
    if (workletsModuleProxy == nullptr) {
      assignError(error, @"IOSWorkletsModuleProxyHolder does not contain a WorkletsModuleProxy.");
      return NO;
    }

    std::shared_ptr<UIScheduler> uiScheduler = workletsModuleProxy->getUIScheduler();
    if (uiScheduler == nullptr) {
      assignError(error, @"Could not access UIScheduler from WorkletsModuleProxy.");
      return NO;
    }

    std::shared_ptr<WorkletRuntime> uiWorkletRuntime = workletsModuleProxy->getUIWorkletRuntime();
    if (uiWorkletRuntime == nullptr) {
      assignError(error, @"Could not access UIWorkletRuntime from WorkletsModuleProxy.");
      return NO;
    }

    uint64_t runtimeId = uiWorkletRuntime->getRuntimeId();
    if (sHasInstalledRuntime && sInstalledRuntimeId == runtimeId) {
      return YES;
    }

    bool hasNativeModuleProxy = false;
    uiWorkletRuntime->runSync([&](jsi::Runtime &runtime) {
      // We first have to set this to be bridgeless too
      // TODO: upstream this to worklets to set this for their runtime if the JS runtime is bridgeless
      // Note: do i want to make this xplat? have the same code dupe in android
      if (!runtime.global().hasProperty(runtime, "RN$Bridgeless")) {
        react::defineReadOnlyGlobal(runtime, "RN$Bridgeless", jsi::Value(true));
      }
      
      jsi::Value proxy = runtime.global().getProperty(runtime, "nativeModuleProxy");
      hasNativeModuleProxy = !proxy.isUndefined() && !proxy.isNull();
    });
    if (hasNativeModuleProxy) {
      sHasInstalledRuntime = YES;
      sInstalledRuntimeId = runtimeId;
      return YES;
    }

    // `[RCTBridge currentBridge]` is nil under bridgeless / new-arch; fall back to the injected
    // bridge proxy (see SurfacePresenterRegistry), then to recovering it from a live surface
    // presenter's contextContainer. The code below already handles `RCTBridgeProxy`.
    RCTBridge *bridge = [RCTBridge currentBridge] ?: (RCTBridge *)[SurfacePresenterRegistry currentBridge];
    if (bridge == nil) {
      bridge = (RCTBridge *)[self recoverBridgeProxyFromKeyWindow];
    }
    if (bridge == nil) {
      assignError(error, @"Could not access RCTBridge.currentBridge.");
      return NO;
    }

    RCTModuleRegistry *moduleRegistry = [bridge moduleRegistry];
    if (moduleRegistry == nil) {
      assignError(error, @"Could not access moduleRegistry from the bridge.");
      return NO;
    }

    id turboModuleRegistry = [moduleRegistry valueForKey:@"_turboModuleRegistry"];
    if (![turboModuleRegistry isKindOfClass:[RCTTurboModuleManager class]]) {
      assignError(error, @"moduleRegistry does not contain an active RCTTurboModuleManager.");
      return NO;
    }

    RCTTurboModuleManager *rootTurboModuleManager = (RCTTurboModuleManager *)turboModuleRegistry;
    id<RCTTurboModuleManagerDelegate> delegate = [rootTurboModuleManager valueForKey:@"_delegate"];
    if (delegate == nil) {
      assignError(error, @"Could not access RCTTurboModuleManager delegate.");
      return NO;
    }

    RCTBridgeProxy *bridgeProxy = [rootTurboModuleManager valueForKey:@"_bridgeProxy"];
    if (bridgeProxy == nil && [bridge isKindOfClass:[RCTBridgeProxy class]]) {
      bridgeProxy = (RCTBridgeProxy *)bridge;
    }
    if (bridgeProxy == nil) {
      assignError(error, @"Could not access RCTBridgeProxy.");
      return NO;
    }

    RCTBridgeModuleDecorator *bridgeModuleDecorator = [rootTurboModuleManager valueForKey:@"_bridgeModuleDecorator"];
    if (bridgeModuleDecorator == nil) {
      assignError(error, @"Could not access RCTBridgeModuleDecorator.");
      return NO;
    }

    uiCallInvoker = std::make_shared<margelo::nitro::reactnativelist::WorkletsUiCallInvoker>(uiScheduler, uiWorkletRuntime, []() {
        return [NSThread isMainThread];
    });

    RCTTurboModuleManager *uiTurboModuleManager = [[RCTTurboModuleManager alloc] initWithBridgeProxy:bridgeProxy
                                                           bridgeModuleDecorator:bridgeModuleDecorator
                                                                        delegate:delegate
                                                                       jsInvoker:uiCallInvoker];
    if (uiTurboModuleManager == nil) {
      assignError(error, @"Failed to create a UI-runtime RCTTurboModuleManager.");
      return NO;
    }

      margelo::nitro::Logger::log(margelo::nitro::LogLevel::Debug, "TurboModuleInstaller", "schedule install JSI bindings!");
    uiWorkletRuntime->runSync([uiTurboModuleManager](jsi::Runtime &runtime) {
      [uiTurboModuleManager installJSBindings:runtime];
        margelo::nitro::Logger::log(margelo::nitro::LogLevel::Debug, "TurboModuleInstaller", "installed JSI bindings!");
    });

    sUiTurboModuleManager = uiTurboModuleManager;
    sHasInstalledRuntime = YES;
    sInstalledRuntimeId = runtimeId;
    return YES;
  } @catch (NSException *exception) {
    assignError(error, [NSString stringWithFormat:@"TurboModule install failed with NSException: %@", exception.reason]);
    return NO;
  }
}

+ (BOOL)setupEventInterceptor:(NSError *__autoreleasing _Nullable * _Nullable)error {
  @try {
    if (uiCallInvoker == nullptr) {
      assignError(error, @"UI CallInvoker must be initialized before setting up event interceptor.");
      return NO;
    }

    id surfacePresenterObj = [SurfacePresenterRegistry currentSurfacePresenter];
    if (surfacePresenterObj == nil) {
      assignError(error, @"SurfacePresenter from SurfacePresenterRegistry was null!");
      return NO;
    }

    if (![surfacePresenterObj isKindOfClass:[RCTSurfacePresenter class]]) {
      assignError(error, @"SurfacePresenterRegistry did not return an RCTSurfacePresenter instance.");
      return NO;
    }

    RCTSurfacePresenter *surfacePresenter = (RCTSurfacePresenter *)surfacePresenterObj;
    RCTScheduler *scheduler = surfacePresenter.scheduler;
    if (scheduler == nil) {
      assignError(error, @"Could not access an active RCTScheduler from the current RCTSurfacePresenter.");
      return NO;
    }

    std::shared_ptr<EventListener> eventInterceptor =
        margelo::nitro::reactnativelist::HybridUiManagerHelper::createEventInterceptor(uiCallInvoker);
    [scheduler addEventListener:eventInterceptor];

    return YES;
  } @catch (NSException *exception) {
    assignError(error, [NSString stringWithFormat:@"Event interceptor setup failed with NSException: %@", exception.reason]);
    return NO;
  }
}

@end
