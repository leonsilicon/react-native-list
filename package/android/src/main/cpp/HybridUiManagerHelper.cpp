//
// Created by Hanno Gödecke on 25.01.26.
//

#include "HybridUiManagerHelper.hpp"
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace margelo::nitro::nitrolist {
    using namespace facebook;

    void HybridUiManagerHelper::renderSync(std::shared_ptr<facebook::react::UIManagerBinding> binding) {
        if (!binding) {
            throw std::runtime_error(
                "HybridUiManagerHelper::renderSync: UIManagerBinding is not installed in the runtime.");
        }
        react::UIManager& uiManager = binding->getUIManager();
        static react::SurfaceId surfaceId = 3;
        uiManager.getShadowTreeRegistry().visit(surfaceId, [](const react::ShadowTree& shadowTree) {
            // This will immediately cause all queued mounting transactions to be processed
            __android_log_print(ANDROID_LOG_INFO, "HybridUiManagerHelper", "Notifying delegates of updates for surfaceId %d", surfaceId);
            shadowTree.notifyDelegatesOfUpdates();
        });
    }
}