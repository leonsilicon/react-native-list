package com.margelo.nitro.nitrolist

import android.graphics.Color
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

class HybridUiListView(val reactContext: ThemedReactContext) : HybridUiListViewSpec() {
    private var _callback: (() -> Double)? = null

    // TODO: implement the actual view
    override val view: LinearLayout by lazy {
            // Create a new LinearLayout with MATCH_PARENT params
            LinearLayout(reactContext).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.BLUE)
            }
        }

    fun makeView(): View {
        val capturedCallback =
            this._callback ?: throw IllegalStateException("MakeNativeViewCallback is not set!")

        // The callback will render a view to our custom surface
        val viewTag = capturedCallback().toInt()

        // We can now get it from there (i think, lets see)
        val fabricUiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
            ?: throw IllegalStateException("Fabric UIManager is null! Is the Fabric architecture enabled?")

        val view = fabricUiManager.resolveView(viewTag)
            ?: throw IllegalStateException("Could not resolve view with tag $viewTag!")

        (view.parent as? ViewGroup)?.removeView(view)
        if (view.parent != null) {
            throw IllegalStateException("View with tag $viewTag still has a parent!")
        }

        // Now we can use that view on our own muhahaha
        return view
    }

    // Note: to be called on the UI thread
    override fun setMakeNativeViewCallback(uiListModule: HybridUiListModuleSpec, callback: () -> Double) {
        this._callback = callback

        val testView1 = makeView()
//        Log.d("HybridUiListView", "View to insert into size ${view.measuredWidth}x${view.measuredHeight}, testView size ${testView.measuredWidth}x${testView.measuredHeight}")
        val testView2 = makeView()
        view.addView(testView1)

        // TODO: figure out how to render multiple items, right now only one works and it tries to replace that one lol
//        view.addView(testView2)
    }
}