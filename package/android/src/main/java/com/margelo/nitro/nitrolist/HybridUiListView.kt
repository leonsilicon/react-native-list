package com.margelo.nitro.nitrolist

import android.graphics.Color
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

typealias MakeViewCallbackType = () -> Double
typealias UpdateViewCallbackType = (reactTag: Double, index: Double) -> Boolean
class HybridUiListView(val reactContext: ThemedReactContext) : HybridUiListViewSpec() {

    private var makeViewCallback: MakeViewCallbackType? = null
    private var updateViewCallback: UpdateViewCallbackType? = null
    private var adapter: SimpleAdapter? = null

    override val view: RecyclerView by lazy {
        RecyclerView(reactContext).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            layoutManager = LinearLayoutManager(reactContext)
            setBackgroundColor(Color.GRAY)
        }
    }

    private fun makeView(): View {
        val capturedCallback =
            this.makeViewCallback ?: throw IllegalStateException("MakeNativeViewCallback is not set!")

        val viewTag = capturedCallback().toInt()
        Log.d("HannoDebug", "makeView() stacktrace: ", Throwable())

        val fabricUiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
            ?: throw IllegalStateException("Fabric UIManager is null! Is the Fabric architecture enabled?")

        val resolvedView = fabricUiManager.resolveView(viewTag)
            ?: throw IllegalStateException("Could not resolve view with tag $viewTag!")

        val parent = resolvedView.parent as? ViewGroup
            ?: throw IllegalStateException("View with tag $viewTag has no parent!")
        val index = parent.indexOfChild(resolvedView)
        parent.removeViewAt(index)
        if (resolvedView.parent != null)
            throw IllegalStateException("View with tag $viewTag still has a parent after removing!")

        // TODO: its a bit of a memory waste, that we have to create empty views here.
        // Maybe the parent element that holds the list item can be a special view where we overwrite the
        // addViewAt, removeViewAt updateProps, etc. methods to bind to the moved native view directly.
        parent.addView(View(reactContext), index)

        Log.d("HybridUiListView", "Resolved view with tag $viewTag, size ${resolvedView.measuredWidth}x${resolvedView.measuredHeight}")
        return resolvedView
    }

    override fun setMakeNativeViewCallback(uiListModule: HybridUiListModuleSpec, callback: MakeViewCallbackType) {
        this.makeViewCallback = callback
    }

    override fun setUpdateViewCallback(
        uiListModule: HybridUiListModuleSpec,
        callback: UpdateViewCallbackType
    ) {
        this.updateViewCallback = callback

        // Do this here, because right now in JS this is called after setMakeNativeViewCallback
        // and we need to have both callbacks set before we can create the adapter.
        // TODO: improve this logic
        adapter = SimpleAdapter(
            itemCount = 10_000,
            createView = { makeView() }, // todo, we really can't pass lambdas directly? or maybe its because its nullable
            updateView = { reactTag, index ->
                val capturedCallback =
                    this.updateViewCallback
                        ?: throw IllegalStateException("UpdateViewCallback is not set!")
                capturedCallback(reactTag, index)
            }
        )
        view.adapter = adapter
        view.adapter!!.notifyDataSetChanged()
//        view.requestLayout()
    }

    private class SimpleAdapter(
        private val itemCount: Int,
        private val createView: () -> View,
        private val updateView: (reactTag: Double, index: Double) -> Boolean
    ) : RecyclerView.Adapter<SimpleAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val item = createView()
            // Ensure the view has proper RecyclerView layout params
            item.layoutParams = ViewGroup.MarginLayoutParams(
                item.measuredWidth,
                item.measuredHeight
            ).also {
                it.bottomMargin = 40
            }

            Log.d("HybridUiListView", "onCreateViewHolder: view size ${item.measuredWidth}x${item.measuredHeight}, layoutParams=${item.layoutParams}")
            return ViewHolder(item)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val view = holder.itemView
            val reactTag = view.id
            val success = updateView(reactTag.toDouble(), position.toDouble())
            Log.d("HybridUiListView", "onBindViewHolder($position)=$success")
        }

        override fun getItemCount(): Int = itemCount
    }
}