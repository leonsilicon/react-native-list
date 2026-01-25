#include <jni.h>
#include "NitroListOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *)
{
  return margelo::nitro::nitrolist::initialize(vm);
}
