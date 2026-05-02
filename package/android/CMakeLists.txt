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
# (they are PRIVATE in the worklets CMakeLists.txt, so not propagated via prefab)
#TODO: THIS SHOULDN'T BE HARDCODED LIKE THIS!
set(REACT_NATIVE_DIR "${CMAKE_SOURCE_DIR}/../../node_modules/react-native")
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
