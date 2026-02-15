#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface HybridUiListSurfacePresenterRegistry : NSObject <RCTBridgeModule>

+ (nullable id)currentSurfacePresenter;

@end

NS_ASSUME_NONNULL_END
