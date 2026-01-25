package com.margelo.nitro.nitrolist

import com.facebook.react.ReactActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.NitroModules

class HybridUiListModule : HybridUiListModuleSpec() {
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
        surfaceView.rootViewTag = 3;

        uiManager.startSurface(
            surfaceView,
            "",
            null,
            //measuredWidth and height, puhh
            surfaceView.measuredWidth,
            surfaceView.measuredHeight
        )
    }
}