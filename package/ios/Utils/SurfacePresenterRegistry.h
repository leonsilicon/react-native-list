#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A module whos purpose it is to receive the surface presenter.
 * (RN injects this during module instantiation).
 */
@interface SurfacePresenterRegistry : NSObject <RCTBridgeModule>

+ (nullable id)currentSurfacePresenter;

/**
 * Publish a surface presenter into the registry even when RN never instantiated this module (so its
 * `setSurfacePresenter:` injection never fired). Used by the key-window bridge-recovery path under
 * bridgeless / new-arch.
 */
+ (void)setCurrentSurfacePresenter:(nullable id)surfacePresenter;

/**
 * The bridge (an `RCTBridgeProxy` under bridgeless / new-arch) that RN injects into this
 * `RCTBridgeModule` via `setBridge:`. Captured statically so the worklets / surface-presenter
 * installer can reach it WITHOUT `[RCTBridge currentBridge]`, which is `nil` in bridgeless mode
 * (Expo SDK 56). Returns `nil` until RN instantiates the module.
 */
+ (nullable id)currentBridge;

@end

NS_ASSUME_NONNULL_END
