package com.margelo.nitro.nitrolist

import android.graphics.Color
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.core.view.marginBottom
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

class HybridUiListView(val reactContext: ThemedReactContext) : HybridUiListViewSpec() {
    private var _callback: (() -> Double)? = null
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
            this._callback ?: throw IllegalStateException("MakeNativeViewCallback is not set!")

        val viewTag = capturedCallback().toInt()

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

        parent.addView(View(reactContext), index)

        Log.d("HybridUiListView", "Resolved view with tag $viewTag, size ${resolvedView.measuredWidth}x${resolvedView.measuredHeight}")
        return resolvedView
    }

    override fun setMakeNativeViewCallback(uiListModule: HybridUiListModuleSpec, callback: () -> Double) {
        this._callback = callback

        adapter = SimpleAdapter(
            itemCount = 10_000,
            createView = { makeView() }
        )
        view.adapter = adapter
        view.adapter?.notifyDataSetChanged()
        Log.d("HybridUiListView", "Set MakeNativeViewCallback and updated adapter")
    }

    private class SimpleAdapter(
        private val itemCount: Int,
        private val createView: () -> View
    ) : RecyclerView.Adapter<SimpleAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            var item = createView()
            // Ensure the view has proper RecyclerView layout params
            item.layoutParams = ViewGroup.MarginLayoutParams(
                item.measuredWidth,
                item.measuredHeight
            ).also {
                it.bottomMargin = 40
            }
//            val item = View(parent.context)
//            item.layoutParams = RecyclerView.LayoutParams(
//                400,
//                400
//            )
//            // set blue bg color
//            item.setBackgroundColor(Color.BLUE)
            Log.d("HybridUiListView", "onCreateViewHolder: view size ${item.measuredWidth}x${item.measuredHeight}, layoutParams=${item.layoutParams}")
            return ViewHolder(item)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
//            holder.container.removeAllViews()
//            val childView = createView()
//            holder.container.addView(childView)
            Log.d("HybridUiListView", "Bound view at position $position")
        }

        override fun getItemCount(): Int = itemCount
    }
}