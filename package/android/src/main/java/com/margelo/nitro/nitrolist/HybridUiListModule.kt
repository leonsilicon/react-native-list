package com.margelo.nitro.nitrolist

import com.facebook.react.BaseReactPackage
import com.facebook.react.ReactActivity
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.turbomodule.core.TurboModuleManager
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.debug.SourceCodeModule
import com.facebook.react.modules.systeminfo.AndroidInfoModule
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.NitroModules
import com.swmansion.worklets.WorkletsModule
import java.util.ArrayList
import kotlin.concurrent.Volatile

class HybridUiListModule : HybridUiListModuleSpec() {
    var reactSurfaceView: ReactSurfaceView? = null

    // com/facebook/react/runtime/CoreReactPackage.kt
//    class CoreReactPackage() : BaseReactPackage() {
//        override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
//            when (name) {
//                AndroidInfoModule.NAME -> AndroidInfoModule(reactContext)
//                SourceCodeModule.NAME -> SourceCodeModule(reactContext)
////                DeviceInfoModule.NAME -> DeviceInfoModule(reactContext)
//                "DeviceInfo" -> {
//                    val classDeviceInfoModule = Class.forName("com.facebook.react.modules.deviceinfo.DeviceInfoModule")
//                    val constructor = classDeviceInfoModule.getConstructor(ReactApplicationContext::class.java)
//                    return constructor.newInstance(reactContext) as NativeModule
//                }
//            }
//        }
//
//        override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
//            if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
//                return fallbackForMissingClass()
//            }
//            try {
//                val reactModuleInfoProviderClass =
//                    ClassFinder.findClass("${com.facebook.react.runtime.CoreReactPackage::class.java.name}$\$ReactModuleInfoProvider")
//                @Suppress("DEPRECATION")
//                return reactModuleInfoProviderClass?.newInstance() as? ReactModuleInfoProvider
//                    ?: fallbackForMissingClass()
//            } catch (e: Exception) {
//                when (e) {
//                    is ClassNotFoundException -> return fallbackForMissingClass()
//                    is InstantiationException,
//                    is IllegalAccessException ->
//                        throw RuntimeException(
//                            "No ReactModuleInfoProvider for ${com.facebook.react.runtime.CoreReactPackage::class.java.name}$\$ReactModuleInfoProvider",
//                            e,
//                        )
//                    else -> throw e
//                }
//            }
//        }
//    }

    @OptIn(UnstableReactNativeAPI::class, FrameworkAPI::class)
    override fun setupExternalSurface() {
        val context: ReactApplicationContext = NitroModules.applicationContext
            ?: throw IllegalStateException("ReactApplicationContext is null! Is Nitro installed?")

        // Obtain the fabric ui manager
        val uiManager = UIManagerHelper.getUIManager(context, UIManagerType.FABRIC)
            ?: throw IllegalStateException("Fabric UIManager is null! Is the Fabric architecture enabled?")

        val reactActivity = context.currentActivity as? ReactActivity
            ?: throw IllegalStateException("Current activity is not a ReactActivity!")
        val reactHost = reactActivity.reactActivityDelegate.reactHost
            ?: throw IllegalStateException("ReactNativeHost is null!")

        // TODO: where do i pass the surface id?!
        val surface = reactHost.createSurface(context, "", null)
        val surfaceView = surface.view as? ReactSurfaceView
            ?: throw IllegalStateException("Surface view is not a ReactSurfaceView!")
        surfaceView.rootViewTag = 3

        uiManager.startSurface(
            surfaceView,
            "",
            null,
            //measuredWidth and height, puhh
            surfaceView.measuredWidth,
            surfaceView.measuredHeight
        )

        reactSurfaceView = surfaceView

        val workletsModule = context.getNativeModule(WorkletsModule::class.java)
            ?: throw IllegalStateException("WorkletsModule is null! Is the WorkletsModule properly registered?")

        val reactHostImpl = reactHost as? ReactHostImpl
            ?: throw IllegalStateException("ReactHost is not a ReactHostImpl! Is the New Architecture enabled?")

        val reactHostDelegateField = reactHostImpl.javaClass.getDeclaredField("reactHostDelegate")
        reactHostDelegateField.isAccessible = true
        val reactHostDelegate = reactHostDelegateField.get(reactHostImpl) as? ReactHostDelegate
            ?: throw IllegalStateException("ReactHostDelegate is null! Is the New Architecture enabled?")

        // Get nativeMethodCallInvokerHolder from reactInstance, which lives on reactHostImpl
        val reactInstanceField = reactHostImpl.javaClass.getDeclaredField("reactInstance")
        reactInstanceField.isAccessible = true
        val reactInstance = reactInstanceField.get(reactHostImpl)
            ?: throw IllegalStateException("ReactInstance is null! Is the New Architecture enabled?")
        val getNativeMethodCallInvokerHolderMethod = reactInstance.javaClass.getDeclaredMethod("getNativeMethodCallInvokerHolder")
        getNativeMethodCallInvokerHolderMethod.isAccessible = true
        val nativeMethodCallInvokerHolder = getNativeMethodCallInvokerHolderMethod.invoke(reactInstance) as? NativeMethodCallInvokerHolder
            ?: throw IllegalStateException("NativeMethodCallInvokerHolder is null! Is the New Architecture enabled?")

        val reactPackages: MutableList<ReactPackage> = ArrayList<ReactPackage>()
        val coreReactPackageClass = Class.forName("com.facebook.react.runtime.CoreReactPackage")
        val constructor = coreReactPackageClass.declaredConstructors.first()
        constructor.isAccessible = true
        // TODO: this will create dev support modules on the UI runtime which is unnecessary overhead we don't need!
        //       In a past version i simply put in the most important core modules from JS, which was somewhat nicer.
        val coreReactPackage = constructor.newInstance(reactHost.devSupportManager, DefaultHardwareBackBtnHandler {}) as ReactPackage
        reactPackages.add(coreReactPackage)
        reactPackages.addAll(reactHostDelegate.reactPackages)

        // TODO: should i do this on the ui thread?
        // TODO(RN): I feel like this could also be created globally somewhere so I can grab and reuse it?
        UiThreadUtil.runOnUiThread {
            val turboModuleManagerDelegate = reactHostDelegate.turboModuleManagerDelegateBuilder
                .setPackages(reactPackages)
                .setReactApplicationContext(context)
                .build()

            val uiCallInvokerHolder = getUiCallInvokerHolder(workletsModule)
            val uiRuntimeExecutor = getUiRuntimeExecutor(workletsModule)

            // This will install the JSI bindings
            uiTurboModuleManager = TurboModuleManager(
                runtimeExecutor = uiRuntimeExecutor,
                delegate = turboModuleManagerDelegate,
                jsCallInvokerHolder = uiCallInvokerHolder,
                nativeMethodCallInvokerHolder = nativeMethodCallInvokerHolder
            )
        }


        // First get private var reactInstance: ReactInstance? = null from reactHost using reflection, but keeping type generic as we can't import ReactInstance:
//        val reactInstanceField = reactHost.javaClass.getDeclaredField("reactInstance")
//        reactInstanceField.isAccessible = true
//        val reactInstance = reactInstanceField.get(reactHost)

        // Now get private var turboModuleManager: TurboModuleManager? = null from reactInstance using reflection
//        val turboModuleManagerField = reactInstance.javaClass.getDeclaredField("turboModuleManager")
//        turboModuleManagerField.isAccessible = true
//        val turboModuleManager = turboModuleManagerField.get(reactInstance) as? TurboModuleManager
//            ?: throw IllegalStateException("TurboModuleManager is null! Is the New Architecture enabled")

//        val test = turboModuleManager
    }

    @OptIn(FrameworkAPI::class)
    private external fun getUiCallInvokerHolder(workletsModule: WorkletsModule): CallInvokerHolderImpl

    private external fun getUiRuntimeExecutor(workletsModule: WorkletsModule): RuntimeExecutor

    @Volatile
    private lateinit var uiTurboModuleManager: TurboModuleManager
}