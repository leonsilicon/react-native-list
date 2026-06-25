//
//  SurfaceHelper.h
//  ReactNativeList
//
//  Created by Hanno Gödecke on 15.02.26.
//

#import <Foundation/Foundation.h>
#import <React/RCTPrimitives.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface SurfaceHelper : NSObject
+ (nullable NSNumber *)createExternalSurface:(NSError * _Nullable * _Nullable)error;
+ (BOOL)releaseExternalSurface:(ReactTag)surfaceId error:(NSError * _Nullable * _Nullable)error;
+ (nullable UIView *)getViewByTag:(ReactTag)tag error:(NSError * _Nullable * _Nullable)error;

/**
 * Attach an `RCTSurfaceTouchHandler` (a `UIGestureRecognizer`) to a hosted Fabric view so touches on
 * it become Fabric touch events (otherwise the view tree generates NO events — the external surfaces
 * this list creates have no touch handler, unlike a normal RN root view / Modal host). Idempotent:
 * skips if a handler is already attached. Returns YES if a handler is now attached.
 *
 * NOTE: this is fragile inside a scrolling collection view (the surface touch handler fights the
 * scroll gesture). Prefer a single list-level `UITapGestureRecognizer` + `dispatchListTapToJS`.
 */
+ (BOOL)attachTouchHandler:(UIView *)view;

/**
 * Call `globalThis.__rnlListTap(itemIndex, x, y)` on the JS runtime (via the surface presenter's
 * RuntimeExecutor). Used by the list's single tap recognizer so JS — which owns the per-item grid
 * geometry + grapheme data — can map a cell-local tap to the tapped morpheme and navigate. No-op if
 * the runtime or the global handler isn't available.
 */
+ (void)dispatchListTapToJS:(double)itemIndex x:(double)x y:(double)y;
@end

NS_ASSUME_NONNULL_END
