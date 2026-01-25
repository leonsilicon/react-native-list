#pragma once

#include <NitroModules/JSIConverter.hpp>
#include <react/renderer/uimanager/UIManagerBinding.h>


namespace margelo::nitro {
    template <>
    struct JSIConverter<std::shared_ptr<facebook::react::UIManagerBinding>> final {
        static inline std::shared_ptr<facebook::react::UIManagerBinding> fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
            jsi::Object object = arg.asObject(runtime);
            std::shared_ptr<facebook::react::UIManagerBinding> binding = object.getHostObject<facebook::react::UIManagerBinding>(runtime);
            return binding;
        }
        static inline jsi::Value toJSI(jsi::Runtime&, std::shared_ptr<facebook::react::UIManagerBinding> arg) {
            throw std::runtime_error("JSIConverter<UIManagerBinding>::toJSI is not implemented.");
        }
        static inline bool canConvert(jsi::Runtime& runtime, const jsi::Value& value) {
            if (value.isObject()) {
                jsi::Object object = value.getObject(runtime);
                return object.isHostObject<std::shared_ptr<facebook::react::UIManagerBinding>>(runtime);
            }
            return false;
        }
    };
}