#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface HybridWorkletsModuleProxyHolderBox : NSObject
@end

@interface HybridUiListTurboModuleInstaller : NSObject

+ (nullable HybridWorkletsModuleProxyHolderBox *)createWorkletsModuleProxyHolder:(NSError * _Nullable * _Nullable)error;
+ (BOOL)installNativeModuleProxyInUIRuntimeWithHolder:(HybridWorkletsModuleProxyHolderBox *)holder
                                                 error:(NSError * _Nullable * _Nullable)error;

@end

NS_ASSUME_NONNULL_END
