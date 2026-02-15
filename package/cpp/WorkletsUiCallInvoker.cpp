#include "WorkletsUiCallInvoker.hpp"

namespace margelo::nitro::nitrolist
{
    WorkletsUiCallInvoker::WorkletsUiCallInvoker(std::shared_ptr<worklets::UIScheduler> uiScheduler,
                                                 std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime,
                                                 std::function<bool()> isOnUIThread)
        : uiScheduler_(uiScheduler), uiWorkletRuntime_(uiWorkletRuntime), isOnUIThread_(isOnUIThread) {}

    void WorkletsUiCallInvoker::invokeAsync(CallFunc &&func) noexcept
    {
        uiScheduler_->scheduleOnUI(
            [func = std::move(func), uiWorkletRuntime = uiWorkletRuntime_]()
            {
                jsi::Runtime &runtime = uiWorkletRuntime->getJSIRuntime();
                func(runtime);
            });

        // Check: is ui thread
        if (!isOnUIThread_())
        {
            uiScheduler_->triggerUI();
        }
    }

    void WorkletsUiCallInvoker::invokeSync(facebook::react::CallFunc &&func)
    {
        throw std::runtime_error("invokeSync is currently not supported.");
    }

} // namespace margelo::nitro::nitrolist