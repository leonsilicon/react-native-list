//
// Created by Hanno Gödecke on 25.01.26.
//

#pragma once

#include "HybridUiManagerHelperSpec.hpp"
#include "WorkletsUiCallInvoker.hpp"

#include <react/renderer/scheduler/Scheduler.h>

namespace margelo::nitro::nitrolist
{

    class HybridUiManagerHelper : public HybridUiManagerHelperSpec
    {
    public:
        HybridUiManagerHelper() : HybridObject(TAG) {}

    public:
        void renderSync(std::shared_ptr<facebook::react::UIManagerBinding> nativeFabricUIManager) override;
        static void setupEventInterceptor(const std::shared_ptr<facebook::react::Scheduler> &scheduler, std::shared_ptr<react::CallInvoker> uiCallInvoker);
    };

}
