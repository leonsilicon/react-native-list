#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A module whos purpose it is to receive the surface presenter.
 * (RN injects this during module instantiation).
 */
@interface SurfacePresenterRegistry : NSObject <RCTBridgeModule>

+ (nullable id)currentSurfacePresenter;

@end

NS_ASSUME_NONNULL_END
