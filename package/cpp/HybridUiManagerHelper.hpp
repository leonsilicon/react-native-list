//
// Created by Hanno Gödecke on 25.01.26.
//

#pragma once

#include "HybridUiManagerHelperSpec.hpp"

namespace margelo::nitro::nitrolist {

    class HybridUiManagerHelper : public HybridUiManagerHelperSpec {
    public:
        HybridUiManagerHelper() : HybridObject(TAG) {}

    public:
        void renderSync(std::shared_ptr<facebook::react::UIManagerBinding> nativeFabricUIManager) override;
    };

}
