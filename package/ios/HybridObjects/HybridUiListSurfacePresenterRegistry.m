#import "HybridUiListSurfacePresenterRegistry.h"

#import <React/RCTSurfacePresenterStub.h>

@protocol RCTTurboModule;

static __weak id<RCTSurfacePresenterStub> sCurrentSurfacePresenter = nil;

@interface HybridUiListSurfacePresenterRegistry () <RCTTurboModule>
@end

@implementation HybridUiListSurfacePresenterRegistry

RCT_EXPORT_MODULE(HybridUiListSurfacePresenterRegistry);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

+ (nullable id)currentSurfacePresenter
{
  return sCurrentSurfacePresenter;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  sCurrentSurfacePresenter = surfacePresenter;
}

@end
