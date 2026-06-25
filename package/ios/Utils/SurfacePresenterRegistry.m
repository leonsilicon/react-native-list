#import "SurfacePresenterRegistry.h"

#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenterStub.h>

@protocol RCTTurboModule;

static __weak id<RCTSurfacePresenterStub> sCurrentSurfacePresenter = nil;
// Captured from RN's `setBridge:` injection. Under bridgeless / new-arch this is an
// `RCTBridgeProxy`; `[RCTBridge currentBridge]` is `nil` there, so this is the only reliable handle
// the worklets/surface-presenter installer has to the bridge(-proxy). Weak so we don't keep RN's
// bridge alive past teardown.
static __weak id sCurrentBridge = nil;

@interface SurfacePresenterRegistry () <RCTTurboModule>
@end

@implementation SurfacePresenterRegistry

// RN sets this via `setBridge:` on every `RCTBridgeModule` — including under bridgeless, where it is
// an `RCTBridgeProxy`. `@synthesize` so the property storage exists; the override below also stashes
// it statically for `+currentBridge`.
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(HybridUiListSurfacePresenterRegistry);

+ (BOOL)requiresMainQueueSetup
{
  // Return YES so RN EAGERLY instantiates this module at app launch (it loads every
  // main-queue-setup module up front — see RCTInstance `unstableModulesRequiringMainQueueSetup`
  // → `moduleForName:` loop). That makes RN call `setBridge:` (capturing the bridge proxy) and
  // `_attachBridgelessAPIsToModule:` (calling `setSurfacePresenter:`) BEFORE any JS runs, so
  // `+currentBridge` / `+currentSurfacePresenter` are already populated by the time the demo's
  // `iosGetWorkletsModule()` needs them. With NO this module was lazy and never instantiated under
  // bridgeless until something fetched it — but the worklets installer has no bridge handle to fetch
  // it WITH, hence the "currentBridge nil" failure (Expo SDK 56 bridgeless: `[RCTBridge currentBridge]`
  // is always nil).
  return YES;
}

+ (nullable id)currentSurfacePresenter
{
  return sCurrentSurfacePresenter;
}

+ (void)setCurrentSurfacePresenter:(nullable id)surfacePresenter
{
  sCurrentSurfacePresenter = surfacePresenter;
}

+ (nullable id)currentBridge
{
  return sCurrentBridge;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  sCurrentBridge = bridge;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  sCurrentSurfacePresenter = surfacePresenter;
}

@end
