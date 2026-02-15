//
//  ErrorUtils.h
//  NitroList
//
//  Created by Hanno Gödecke on 15.02.26.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

static NSString *const kInstallerErrorDomain = @"NitroList.HybridUiListTurboModuleInstaller";

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
NS_ASSUME_NONNULL_END
