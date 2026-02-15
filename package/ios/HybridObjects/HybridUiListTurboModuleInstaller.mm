#import "HybridUiListTurboModuleInstaller.h"
#import "HybridUiListSurfacePresenterRegistry.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTBridgeProxy+Cxx.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceProtocol.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <worklets/apple/AssertJavaScriptQueue.h>
#import <worklets/apple/WorkletsModule.h>

#include <jsi/jsi.h>

using namespace facebook;
using namespace facebook::react;
using namespace worklets;

namespace {

static NSString *const kInstallerErrorDomain = @"NitroList.HybridUiListTurboModuleInstaller";

class WorkletsUiCallInvoker final : public CallInvoker {
 public:
  WorkletsUiCallInvoker(std::shared_ptr<UIScheduler> uiScheduler, std::shared_ptr<WorkletRuntime> uiWorkletRuntime)
      : uiScheduler_(std::move(uiScheduler)), uiWorkletRuntime_(std::move(uiWorkletRuntime))
  {
  }

  void invokeAsync(CallFunc &&func) noexcept override
  {
    std::shared_ptr<UIScheduler> uiScheduler = uiScheduler_;
    std::shared_ptr<WorkletRuntime> uiWorkletRuntime = uiWorkletRuntime_;
    uiScheduler->scheduleOnUI([func = std::move(func), uiWorkletRuntime]() mutable {
      jsi::Runtime &runtime = uiWorkletRuntime->getJSIRuntime();
      func(runtime);
    });
    if ([NSThread isMainThread]) {
      uiScheduler->triggerUI();
    }
  }

  void invokeSync(CallFunc &&func) override
  {
    std::shared_ptr<WorkletRuntime> uiWorkletRuntime = uiWorkletRuntime_;
    uiWorkletRuntime->runSync([func = std::move(func)](jsi::Runtime &runtime) mutable { func(runtime); });
  }

 private:
  std::shared_ptr<UIScheduler> uiScheduler_;
  std::shared_ptr<WorkletRuntime> uiWorkletRuntime_;
};

static RCTTurboModuleManager *sUiTurboModuleManager = nil;
static uint64_t sInstalledRuntimeId = 0;
static BOOL sHasInstalledRuntime = NO;
static id<RCTSurfaceProtocol> sExternalSurface = nil;
static NSInteger sExternalSurfaceRootTag = 0;
static const NSInteger kExternalSurfaceId = 3;

inline void assignError(NSError *__autoreleasing _Nullable *error, NSString *message)
{
  if (error == nil) {
    return;
  }

  *error = [NSError errorWithDomain:kInstallerErrorDomain
                               code:1
                           userInfo:@{
                             NSLocalizedDescriptionKey : message,
                           }];
}

inline id<RCTSurfacePresenterStub> _Nullable resolveSurfacePresenter(RCTBridge *bridge)
{
  id<RCTSurfacePresenterStub> surfacePresenter =
      (id<RCTSurfacePresenterStub>)[HybridUiListSurfacePresenterRegistry currentSurfacePresenter];
  if (surfacePresenter != nil) {
    return surfacePresenter;
  }

  return [bridge surfacePresenter];
}

} // namespace

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

@implementation HybridUiListTurboModuleInstaller

+ (nullable HybridWorkletsModuleProxyHolderBox *)createWorkletsModuleProxyHolder:
    (NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
    RCTBridge *bridge = [RCTBridge currentBridge];
    if (bridge == nil) {
      assignError(error, @"Could not access RCTBridge.currentBridge.");
      return nil;
    }

    if (!IsJavaScriptQueue()) {
      assignError(error, @"iosGetWorkletsModule() must run on the JavaScript queue.");
      return nil;
    }

    // Prime the registry module while we're on the JS queue.
    id registryModule = [bridge moduleForClass:HybridUiListSurfacePresenterRegistry.class];
    if (registryModule == nil) {
      assignError(error, @"Could not initialize HybridUiListSurfacePresenterRegistry.");
      return nil;
    }
    if ([HybridUiListSurfacePresenterRegistry currentSurfacePresenter] == nil) {
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

+ (nullable NSNumber *)createExternalSurface:(NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
    if (![NSThread isMainThread]) {
      assignError(error, @"createExternalSurface() must run on the main thread.");
      return nil;
    }

    if (sExternalSurface != nil) {
      return @(sExternalSurfaceRootTag);
    }

    RCTBridge *bridge = [RCTBridge currentBridge];
    if (bridge == nil) {
      assignError(error, @"Could not access RCTBridge.currentBridge.");
      return nil;
    }

    id<RCTSurfacePresenterStub> surfacePresenter = resolveSurfacePresenter(bridge);
    if (surfacePresenter == nil) {
      assignError(error, @"Could not access an active RCTSurfacePresenter.");
      return nil;
    }

    id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"" initialProperties:@{
        @"surfaceId": @(kExternalSurfaceId)
    }];
    if (surface == nil) {
      assignError(error, @"Failed to create Fabric surface.");
      return nil;
    }

    if (![surface isKindOfClass:[RCTFabricSurface class]]) {
      assignError(error, @"Expected a RCTFabricSurface instance.");
      return nil;
    }

    RCTFabricSurface *fabricSurface = (RCTFabricSurface *)surface;
    const auto &surfaceHandler = [fabricSurface surfaceHandler];
    surfaceHandler.setSurfaceId((facebook::react::SurfaceId)kExternalSurfaceId);

    [surface start];
    sExternalSurfaceRootTag = surface.rootTag;
    if (sExternalSurfaceRootTag != kExternalSurfaceId) {
      [surface stop];
      assignError(error, [NSString stringWithFormat:@"Unexpected surface rootTag: %ld", (long)sExternalSurfaceRootTag]);
      return nil;
    }

    NSLog(@"Created external surface!");
    sExternalSurface = surface;
    return @(sExternalSurfaceRootTag);
  } @catch (NSException *exception) {
    assignError(error, [NSString stringWithFormat:@"Surface creation failed with NSException: %@", exception.reason]);
    return nil;
  }
}

+ (BOOL)installNativeModuleProxyInUIRuntimeWithHolder:(HybridWorkletsModuleProxyHolderBox *)holder
                                                 error:(NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
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

    // TODO: this seems quite defensive, remove?
    bool hasNativeModuleProxy = false;
    uiWorkletRuntime->runSync([&](jsi::Runtime &runtime) {
      jsi::Value proxy = runtime.global().getProperty(runtime, "nativeModuleProxy");
      hasNativeModuleProxy = !proxy.isUndefined() && !proxy.isNull();
    });
    if (hasNativeModuleProxy) {
      sHasInstalledRuntime = YES;
      sInstalledRuntimeId = runtimeId;
      return YES;
    }

    RCTBridge *bridge = [RCTBridge currentBridge];
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

    auto uiCallInvoker = std::make_shared<WorkletsUiCallInvoker>(uiScheduler, uiWorkletRuntime);

    RCTTurboModuleManager *uiTurboModuleManager = [[RCTTurboModuleManager alloc] initWithBridgeProxy:bridgeProxy
                                                           bridgeModuleDecorator:bridgeModuleDecorator
                                                                        delegate:delegate
                                                                       jsInvoker:uiCallInvoker];
    if (uiTurboModuleManager == nil) {
      assignError(error, @"Failed to create a UI-runtime RCTTurboModuleManager.");
      return NO;
    }

    uiWorkletRuntime->runSync([uiTurboModuleManager](jsi::Runtime &runtime) {
      [uiTurboModuleManager installJSBindings:runtime];
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

@end
