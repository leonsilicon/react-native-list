#include "JHybridUiListModule.h"

#include <android/log.h>

namespace margelo::nitro::nitrolist {

    std::shared_ptr<react::CallInvoker> JHybridUiListModule::uiCallInvoker_ = nullptr;

    class WorkletsUiCallInvoker : public facebook::react::CallInvoker {
    public:
        WorkletsUiCallInvoker(std::shared_ptr<worklets::UIScheduler> uiScheduler,
                              std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime)
                : uiScheduler_(uiScheduler), uiWorkletRuntime_(uiWorkletRuntime) {}

        void invokeAsync(CallFunc &&func) noexcept override {
            uiScheduler_->scheduleOnUI(
                    [func = std::move(func), uiWorkletRuntime = uiWorkletRuntime_]() {
                        jsi::Runtime& runtime = uiWorkletRuntime->getJSIRuntime();
                        func(runtime);
                    });
            // TODO: not sure if i have to call trigger here myself? I _think_ it ticks to some choreographer, so should be fine?
        }

        void invokeSync(facebook::react::CallFunc &&func) override {
            throw std::runtime_error("invokeSync is currently not supported.");
        }

    private:
        std::shared_ptr<worklets::UIScheduler> uiScheduler_;
        std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime_;

    };

    void JHybridUiListModule::registerNatives() {
        javaClassStatic()->registerNatives({
                                                   makeNativeMethod("getUiCallInvokerHolder",
                                                                    getUiCallInvokerHolder),
                                                   makeNativeMethod("getUiRuntimeExecutor",
                                                                    getUiRuntimeExecutor),
                                           });
    }

    std::shared_ptr<react::CallInvoker> JHybridUiListModule::getOrInitCallInvoker(jni::alias_ref<worklets::WorkletsModule::javaobject> workletsModule) {
        if (uiCallInvoker_) {
            return uiCallInvoker_;
        }

        if (!workletsModule) {
            throw std::runtime_error("WorkletsModule reference is null");
        }

        auto workletsModuleProxy =
                workletsModule->cthis()->getWorkletsModuleProxy();

        if (!workletsModuleProxy) {
            throw std::runtime_error("Failed to get WorkletsModuleProxy from WorkletsModule");
        }

        auto uiScheduler = workletsModuleProxy->getUIScheduler();
        if (!uiScheduler) {
            throw std::runtime_error("Failed to get UIScheduler from WorkletsModuleProxy");
        }

        auto uiWorkletRuntime = workletsModuleProxy->getUIWorkletRuntime();
        if (!uiWorkletRuntime) {
            throw std::runtime_error("Failed to get UIWorkletRuntime from WorkletsModuleProxy");
        }

        uiCallInvoker_ = std::make_shared<WorkletsUiCallInvoker>(uiScheduler, uiWorkletRuntime);
        return uiCallInvoker_;
    }

    jni::local_ref<react::CallInvokerHolder::javaobject>
    JHybridUiListModule::getUiCallInvokerHolder(
            jni::alias_ref<JHybridUiListModule> jThis,
            jni::alias_ref<worklets::WorkletsModule::javaobject> workletsModule) {
        std::shared_ptr<react::CallInvoker> uiCallInvoker = getOrInitCallInvoker(workletsModule);

        return react::CallInvokerHolder::newObjectCxxArgs(uiCallInvoker);
    }

    jni::local_ref<react::JRuntimeExecutor::javaobject>
    JHybridUiListModule::getUiRuntimeExecutor(
            jni::alias_ref<JHybridUiListModule> jThis,
            jni::alias_ref<worklets::WorkletsModule::javaobject> workletsModule) {
        std::shared_ptr<react::CallInvoker> uiCallInvoker = getOrInitCallInvoker(workletsModule);

        RuntimeExecutor uiRuntimeExecutor = [uiCallInvoker](auto callback) {
            uiCallInvoker->invokeAsync(std::move(callback));
        };

        return react::JRuntimeExecutor::newObjectCxxArgs(uiRuntimeExecutor);
    }

} // namespace margelo::nitro::nitrolist
