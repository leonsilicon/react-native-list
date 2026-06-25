project(ReactNativeList)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME ReactNativeList)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        ../cpp/HybridUiManagerHelper.cpp
        ../cpp/WorkletsUiCallInvoker.cpp
        src/main/cpp/cpp-adapter.cpp
        src/main/cpp/JHybridUiListModule.cpp
)

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/ReactNativeList+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)


find_library(LOG_LIB log)
find_package(react-native-worklets REQUIRED)       # <-- for Worklets

# Worklets prefab headers transitively need these React Native internal headers
# (they are PRIVATE in the worklets CMakeLists.txt, so not propagated via prefab).
#
# Resolve react-native by walking up from this package and probing each ancestor's
# node_modules/react-native. A fixed "../../node_modules/react-native" only holds for the
# classic flat layout where the package lives at <root>/node_modules/<pkg>; under bun's
# isolated store (this monorepo) react-native is hoisted to a *sibling* node_modules a
# different number of levels up, so the hardcoded path silently pointed at a non-existent
# directory and `jsireact/JSIExecutor.h` (et al.) failed to resolve. The walk handles both.
set(REACT_NATIVE_DIR "")
set(_rnl_probe "${CMAKE_SOURCE_DIR}/..")
foreach(_rnl_i RANGE 8)
        get_filename_component(_rnl_probe "${_rnl_probe}/.." ABSOLUTE)
        if(EXISTS "${_rnl_probe}/node_modules/react-native/ReactCommon")
                set(REACT_NATIVE_DIR "${_rnl_probe}/node_modules/react-native")
                break()
        endif()
endforeach()
if(REACT_NATIVE_DIR STREQUAL "")
        message(FATAL_ERROR "react-native-list: could not locate node_modules/react-native above ${CMAKE_SOURCE_DIR}")
endif()
message(STATUS "react-native-list: resolved REACT_NATIVE_DIR=${REACT_NATIVE_DIR}")
target_include_directories(${PACKAGE_NAME} PRIVATE
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
        "${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
        "${REACT_NATIVE_DIR}/ReactCommon/react/nativemodule/core/ReactCommon"
)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android                                   # <-- Android core
        react-native-worklets::worklets           # <-- Worklets C++ library
)
