#include "JHybridUiListModule.h"

#include <android/log.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/core/EventTarget.h>
#include <react/fabric/FabricUIManagerBinding.h>

namespace margelo::nitro::nitrolist {

    std::shared_ptr<react::CallInvoker> JHybridUiListModule::uiCallInvoker_ = nullptr;
    std::shared_ptr<const react::EventListener> JHybridUiListModule::eventInterceptor_ = nullptr;

    class WorkletsUiCallInvoker : public facebook::react::CallInvoker {
    public:
        WorkletsUiCallInvoker(std::shared_ptr<worklets::UIScheduler> uiScheduler,
                              std::shared_ptr<worklets::WorkletRuntime> uiWorkletRuntime)
                : uiScheduler_(uiScheduler), uiWorkletRuntime_(uiWorkletRuntime) {}

        void invokeAsync(CallFunc &&func) noexcept override {
            uiScheduler_->scheduleOnUI(
                    [func = std::move(func), uiWorkletRuntime = uiWorkletRuntime_]() {
                        jsi::Runtime &runtime = uiWorkletRuntime->getJSIRuntime();
                        func(runtime);
                    });
            // Check: is ui thread
            if (getpid() == gettid()) {
                // TODO: not sure if i have to call trigger here myself? I _think_ it ticks to some choreographer, so should be fine?
                uiScheduler_->triggerUI();
            }
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
                                                   makeNativeMethod("setupEventInterceptor",
                                                                    setupEventInterceptor),
                                           });
    }

    std::shared_ptr<react::CallInvoker> JHybridUiListModule::getOrInitCallInvoker(
            jni::alias_ref<worklets::WorkletsModule::javaobject> workletsModule) {
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

    void JHybridUiListModule::setupEventInterceptor(
            jni::alias_ref<JHybridUiListModule> jThis,
            jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager) {
        if (!uiCallInvoker_) {
            throw std::runtime_error(
                    "UI CallInvoker must be initialized before setting up event interceptor");
        }

        if (!fabricUIManager) {
            throw std::runtime_error("FabricUIManager reference is null");
        }
        std::shared_ptr<react::Scheduler> scheduler = fabricUIManager->getBinding()->getScheduler();

        if (!scheduler) {
            throw std::runtime_error("Failed to get Scheduler from FabricUIManager");
        }

        eventInterceptor_ = std::make_shared<react::EventListener>(
                [uiCallInvoker = uiCallInvoker_](const react::RawEvent &event) {
                    // Intercept all events and trigger a transaction to ensure the UI thread is processing updates.
                    auto eventSurfaceId = event.eventTarget->getSurfaceId();
                    if (eventSurfaceId == 3) {
                        // This is an event from a view we manage, special handling needded
                        __android_log_print(ANDROID_LOG_INFO, "JHybridUiListModule",
                                            "[HannoDebug] Intercepted event from surface 3!");
                        // Expect function handler to be installed on global
                        uiCallInvoker->invokeAsync([event_ = event](jsi::Runtime &runtime) {
                            auto global = runtime.global();
                            auto handlerValue = global.getProperty(runtime, "handleEvent");
                            if (handlerValue.isObject() &&
                                handlerValue.asObject(runtime).isFunction(runtime)) {
                                // TODO: it would be nice to cache this JSI function!
                                auto handlerFunc = handlerValue.asObject(runtime).asFunction(
                                        runtime);

                                // from: UIManagerBinding.cpp#63
                                if (event_.eventPayload->getType() ==
                                    react::EventPayloadType::PointerEvent) {
                                    throw std::runtime_error(
                                            "PointerEvent payload handling is not implemented yet");
                                } else {
                                    auto payload = event_.eventPayload->asJSIValue(runtime);
                                    if (payload.isNull()) {
                                        __android_log_print(ANDROID_LOG_ERROR,
                                                            "JHybridUiListModule",
                                                            "[HannoDebug] Event payload is null, skipping event handling");
                                        return;
                                    }

                                    auto instanceHandle = event_.eventTarget == nullptr ? jsi::Value::null() : [&]() {
                                        event_.eventTarget->retain(runtime);
                                        auto instanceHandle = event_.eventTarget->getInstanceHandle(
                                                runtime);
                                        if (instanceHandle.isUndefined()) {
                                            return jsi::Value::null();
                                        }

                                        // Mixing `target` into `payload`.
                                        if (!payload.isObject()) {
                                            __android_log_print(ANDROID_LOG_ERROR,
                                                                "JHybridUiListModule",
                                                                "[HannoDebug] Event payload is not an object, skipping event handling");
                                        }
                                        react_native_assert(payload.isObject());
                                        payload.asObject(runtime).setProperty(
                                                runtime, "target", event_.eventTarget->getTag());
                                        return instanceHandle;
                                    }();

                                    if (instanceHandle.isNull()) {
                                        __android_log_print(ANDROID_LOG_ERROR,
                                                            "JHybridUiListModule",
                                                            "[HannoDebug] Event target instance handle is null, skipping event handling");
                                    }


                                    handlerFunc.call(
                                            runtime,
                                            std::move(instanceHandle),
                                            jsi::String::createFromUtf8(runtime, event_.type),
                                            std::move(payload)
                                    );
                                    __android_log_print(ANDROID_LOG_INFO, "JHybridUiListModule",
                                                        "[HannoDebug] Called JS event handler successfully");
                                    event_.eventTarget->release(runtime);
                                }
                            } else {
                                throw std::runtime_error(
                                        "handleEvent function is not defined on the global object");
                            }
                        });

                        // TODO: setup weird JS event system on the JS side!
                        return true;
                    }

                    return false;
                });

        // TODO: unregister
        scheduler->addEventListener(eventInterceptor_);
    }

} // namespace margelo::nitro::nitrolist
