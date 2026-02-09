package com.margelo.nitro.nitrolist

import com.facebook.react.ReactActivity
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.turbomodule.core.TurboModuleManager
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
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

        val surface = reactHost.createSurface(context, "", null)
        val surfaceView = surface.view as? ReactSurfaceView
            ?: throw IllegalStateException("Surface view is not a ReactSurfaceView!")
        surfaceView.setRootViewTag(3)

        uiManager.startSurface(
            surfaceView,
            "",
            null,
            surfaceView.measuredWidth,
            surfaceView.measuredHeight
        )

        reactSurfaceView = surfaceView

        // Next: Create a TurboModuleManager for the UI runtime, which will set global.nativeModuleProxy
        // This is whats being used when doing NativeModule.MyNativeModule in JS!
        // TODO: i use a bunch of internals here, can this be improved?

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

            val fabricUIManager = uiManager as? FabricUIManager
                ?: throw IllegalStateException("UIManager is not a FabricUIManager! Is the Fabric architecture enabled?")
            setupEventInterceptor(fabricUIManager)
        }
    }

    @OptIn(FrameworkAPI::class)
    private external fun getUiCallInvokerHolder(workletsModule: WorkletsModule): CallInvokerHolderImpl

    private external fun getUiRuntimeExecutor(workletsModule: WorkletsModule): RuntimeExecutor

    private external fun setupEventInterceptor(fabricUIManager: FabricUIManager)

    @Volatile
    private lateinit var uiTurboModuleManager: TurboModuleManager
}