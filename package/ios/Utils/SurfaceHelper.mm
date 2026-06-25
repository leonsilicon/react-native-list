//
//  SurfaceHelper.m
//  ReactNativeList
//
//  Created by Hanno Gödecke on 15.02.26.
//

#import "SurfaceHelper.h"
#import "SurfacePresenterRegistry.h"
#import "TurboModuleInstaller.h"
#import "ErrorUtils.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceProtocol.h>

#import <React/RCTComponentViewProtocol.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTMountingManager.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <objc/runtime.h>
#import <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>

using namespace facebook;
using namespace facebook::react;

namespace {
    static NSMutableDictionary<NSNumber *, id<RCTSurfaceProtocol>> *externalSurfaces()
    {
      static NSMutableDictionary<NSNumber *, id<RCTSurfaceProtocol>> *surfaces = nil;
      static dispatch_once_t onceToken;
      dispatch_once(&onceToken, ^{
        surfaces = [NSMutableDictionary new];
      });
      return surfaces;
    }

    inline RCTSurfacePresenter* _Nullable resolveSurfacePresenter(RCTBridge *bridge)
    {
      id<RCTSurfacePresenterStub> surfacePresenter =
          (id<RCTSurfacePresenterStub>)[SurfacePresenterRegistry currentSurfacePresenter];
      if (surfacePresenter != nil) {
        return surfacePresenter;
      }

      if (bridge != nil) {
        RCTSurfacePresenter *fromBridge = [bridge surfacePresenter];
        if (fromBridge != nil) {
          return fromBridge;
        }
      }

      // Bridgeless / new-arch (Expo SDK 56): `[RCTBridge currentBridge]` is nil and RN never injected
      // the presenter into our registry. Recover it by walking the mounted window hierarchy (also
      // publishes it into the registry for subsequent calls).
      return (RCTSurfacePresenter *)[TurboModuleInstaller recoverSurfacePresenterFromKeyWindow];
    }
} // namespace

@implementation SurfaceHelper

+ (nullable NSNumber *)createExternalSurface:(NSError *__autoreleasing _Nullable * _Nullable)error
{
  @try {
    if (![NSThread isMainThread]) {
      assignError(error, @"createExternalSurface() must run on the main thread.");
      return nil;
    }

    // `[RCTBridge currentBridge]` is nil under bridgeless / new-arch; that's fine — the surface
    // presenter is recovered from the registry / mounted window hierarchy inside
    // `resolveSurfacePresenter`, which is all this path actually needs.
    RCTBridge *bridge = [RCTBridge currentBridge];

    RCTSurfacePresenter *surfacePresenter = resolveSurfacePresenter(bridge);
    if (surfacePresenter == nil) {
      assignError(error, @"Could not access an active RCTSurfacePresenter.");
      return nil;
    }

    id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"" initialProperties:@{}];
    if (surface == nil) {
      assignError(error, @"Failed to create Fabric surface.");
      return nil;
    }

    if (![surface isKindOfClass:[RCTFabricSurface class]]) {
      assignError(error, @"Expected a RCTFabricSurface instance.");
      return nil;
    }

    [surface start];
    NSNumber *surfaceId = @(surface.rootTag);
    externalSurfaces()[surfaceId] = surface;
    NSLog(@"Created external surface %@", surfaceId);
    return surfaceId;
  } @catch (NSException *exception) {
    assignError(error, [NSString stringWithFormat:@"Surface creation failed with NSException: %@", exception.reason]);
    return nil;
  }
}

+ (BOOL)releaseExternalSurface:(ReactTag)surfaceId error:(NSError * _Nullable __autoreleasing * _Nullable)error {
    @try {
        if (![NSThread isMainThread]) {
          assignError(error, @"releaseExternalSurface() must run on the main thread.");
          return NO;
        }

        NSNumber *surfaceKey = @(surfaceId);
        id<RCTSurfaceProtocol> surface = externalSurfaces()[surfaceKey];
        if (surface == nil) {
            return YES;
        }

        [surface stop];
        [externalSurfaces() removeObjectForKey:surfaceKey];
        return YES;
    } @catch (NSException *exception) {
        assignError(error, [NSString stringWithFormat:@"Surface release failed with NSException: %@", exception.reason]);
        return NO;
    }
}

+ (nullable UIView *)getViewByTag:(ReactTag)tag error:(NSError * _Nullable __autoreleasing * _Nullable)error {
    if (![NSThread isMainThread]) {
      assignError(error, @"getViewByTag() must run on the main thread.");
      return nil;
    }

    // `[RCTBridge currentBridge]` is nil under bridgeless / new-arch; `resolveSurfacePresenter`
    // recovers the presenter from the registry / mounted window hierarchy instead.
    RCTBridge *bridge = [RCTBridge currentBridge];

    RCTSurfacePresenter *surfacePresenter = resolveSurfacePresenter(bridge);
    if (surfacePresenter == nil) {
      assignError(error, @"Could not access an active RCTSurfacePresenter.");
      return nil;
    }

    RCTComponentViewRegistry *componentViewRegistry = surfacePresenter.mountingManager.componentViewRegistry;
    Tag intTag = static_cast<Tag>(tag);
    UIView<RCTComponentViewProtocol> *componentView = [componentViewRegistry findComponentViewWithTag:intTag];
    if (componentView == nil) {
        assignError(error, [NSString stringWithFormat:@"Could not resolve view with tag %d on surface %@", intTag, @-1]);
        return nil;
    }
    
    return componentView;
}

+ (BOOL)attachTouchHandler:(UIView *)view
{
    if (view == nil) {
        return NO;
    }
    if (![NSThread isMainThread]) {
        return NO;
    }

    // Retain the handler via an associated object so it lives as long as the view; also lets us make
    // the attach idempotent (the cell re-installs hosted views on recycle).
    static const void *kTouchHandlerKey = &kTouchHandlerKey;
    if (objc_getAssociatedObject(view, kTouchHandlerKey) != nil) {
        return YES;
    }

    RCTSurfaceTouchHandler *touchHandler = [RCTSurfaceTouchHandler new];
    [touchHandler attachToView:view];
    objc_setAssociatedObject(view, kTouchHandlerKey, touchHandler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    return YES;
}

+ (void)dispatchListTapToJS:(double)itemIndex x:(double)x y:(double)y
{
    RCTBridge *bridge = [RCTBridge currentBridge];
    RCTSurfacePresenter *surfacePresenter = resolveSurfacePresenter(bridge);
    if (surfacePresenter == nil) {
        return;
    }
    facebook::react::RuntimeExecutor runtimeExecutor = surfacePresenter.runtimeExecutor;
    if (runtimeExecutor == nullptr) {
        return;
    }
    runtimeExecutor([itemIndex, x, y](facebook::jsi::Runtime &runtime) {
        @try {
            facebook::jsi::Value handler = runtime.global().getProperty(runtime, "__rnlListTap");
            if (!handler.isObject() || !handler.asObject(runtime).isFunction(runtime)) {
                return;
            }
            handler.asObject(runtime).asFunction(runtime).call(
                runtime,
                facebook::jsi::Value(itemIndex),
                facebook::jsi::Value(x),
                facebook::jsi::Value(y));
        } @catch (__unused NSException *e) {
            // Never let a tap-dispatch error crash the app.
        }
    });
}

@end
