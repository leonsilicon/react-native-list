package com.margelo.nitro.nitrolist

import android.util.Log
import android.view.View
import com.facebook.react.uimanager.ThemedReactContext

class HybridUiListView(val reactContext: ThemedReactContext) : HybridUiListViewSpec() {
    private var _callback: (() -> HybridViewHolderSpec)? = null

    // TODO: implement the actual view
    override val view: View
        get() = View(reactContext)

    override fun setMakeNativeViewCallback(callback: () -> Boolean) {
        Log.d("HannoDebug", "lol we just rendered a view sync from ui thread native!")
        callback();
    }
}