#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


@interface HybridWorkletsModuleProxyHolderBox : NSObject
@end

@interface TurboModuleInstaller : NSObject

+ (nullable HybridWorkletsModuleProxyHolderBox *)createWorkletsModuleProxyHolder:(NSError * _Nullable * _Nullable)error;
+ (BOOL)installNativeModuleProxyInUIRuntimeWithHolder:(HybridWorkletsModuleProxyHolderBox *)holder
                                                 error:(NSError * _Nullable * _Nullable)error;
+ (BOOL)setupEventInterceptor:(NSError * _Nullable * _Nullable)error;

/**
 * Recover an `RCTSurfacePresenter` by walking the app's window hierarchy (must be called on the main
 * thread). Used under bridgeless / new-arch (Expo SDK 56) where `[RCTBridge currentBridge]` is nil
 * and RN never auto-instantiates the registry module. Also publishes the presenter into
 * `SurfacePresenterRegistry` as a side effect. Returns nil if no mounted surface is found.
 */
+ (nullable id)recoverSurfacePresenterFromKeyWindow;

@end

NS_ASSUME_NONNULL_END
