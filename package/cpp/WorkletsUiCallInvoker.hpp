
#pragma once

#include <ReactCommon/CallInvoker.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

namespace margelo::nitro::reactnativelist
{
    class WorkletsUiCallInvoker : public facebook::react::CallInvoker
    {
    public:
        WorkletsUiCallInvoker(std::shared_ptr<worklets::UIScheduler> uiScheduler,
                              std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime,
                              std::function<bool()> isOnUIThread);

        void invokeAsync(CallFunc &&func) noexcept override;

        void invokeSync(facebook::react::CallFunc &&func) override;

    private:
        std::shared_ptr<worklets::UIScheduler> uiScheduler_;
        std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime_;
        std::function<bool()> isOnUIThread_;
    };
} // namespace margelo::nitro::reactnativelist
