package com.margelo.nitro.reactnativelist

import android.graphics.Color
import android.graphics.Canvas
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

typealias CreateViewCallbackType = (
    type: String
) -> Double
typealias UpdateViewCallbackType = (
    reactTag: Double,
    item: NativeListItem,
    index: Double
) -> Boolean

class HybridUiListView(val reactContext: ThemedReactContext) :
    HybridUiListViewSpec(),
    NativeListDataSourceObserver {
    private var createViewCallback: CreateViewCallbackType? = null
    private var updateViewCallback: UpdateViewCallbackType? = null
    private var adapter: NativeListAdapter? = null
    private var dataSource: HybridNativeListDataSource? = null
    private var isRecyclerViewLayoutScheduled = false

    override val view: RecyclerView by lazy {
        ClippedRecyclerView(reactContext).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            layoutManager = LinearLayoutManager(reactContext)
            setBackgroundColor(Color.TRANSPARENT)
        }
    }

    override fun setListCallbacks(
        uiListModule: HybridUiListModuleSpec,
        createView: CreateViewCallbackType,
        updateView: UpdateViewCallbackType
    ) {
        createViewCallback = createView
        updateViewCallback = updateView
        runOnMain {
            ensureAdapter()
        }
    }

    override fun setDataSource(dataSource: HybridNativeListDataSourceSpec) {
        val nativeDataSource = dataSource as? HybridNativeListDataSource
            ?: throw IllegalStateException("NativeListDataSource must be created by react-native-list.")

        runOnMain {
            val existingDataSource = this.dataSource
            if (existingDataSource === nativeDataSource) {
                Log.w("HybridUiListView", "setDataSource called with the same data source instance. Ignoring.")
                return@runOnMain
            }

            this.dataSource?.observer = null
            this.dataSource = nativeDataSource
            nativeDataSource.observer = this
            val nativeAdapter = ensureAdapter()
            nativeAdapter.dataSource = nativeDataSource
            nativeAdapter.retainMeasuredContent(nativeDataSource)
            nativeAdapter.notifyDataSetChanged()
            scheduleRecyclerViewLayout()
        }
    }

    override fun setLayout(layout: HybridNativeListLayoutSpec) {
        val layoutProvider = layout as? NativeListLayoutProvider
            ?: throw IllegalStateException("NativeListLayout must provide a platform layout.")

        runOnMain {
            layoutProvider.applyTo(view, reactContext)
            scheduleRecyclerViewLayout()
        }
    }

    override fun dataSourceDidReload(diffResult: DiffUtil.DiffResult?, animated: Boolean) {
        runOnMain {
            val nativeAdapter = ensureAdapter()
            val nativeDataSource = dataSource
            if (nativeDataSource != null) {
                nativeAdapter.retainMeasuredContent(nativeDataSource)
            }

            if (!animated || diffResult == null) {
                nativeAdapter.notifyDataSetChanged()
                scheduleRecyclerViewLayout()
                return@runOnMain
            }

            diffResult.dispatchUpdatesTo(nativeAdapter)
            scheduleRecyclerViewLayout()
        }
    }

    override fun dataSourceDidInsert(index: Int) {
        runOnMain {
            val nativeAdapter = ensureAdapter()
            nativeAdapter.notifyItemInserted(index)
            scheduleRecyclerViewLayout()
        }
    }

    override fun dataSourceDidUpdate(index: Int, previousItem: NativeListItem) {
        runOnMain {
            val nativeAdapter = ensureAdapter()
            nativeAdapter.notifyItemChanged(index)
            scheduleRecyclerViewLayout()
        }
    }

    override fun dataSourceDidRemove(index: Int, removedItem: NativeListItem) {
        runOnMain {
            val nativeAdapter = ensureAdapter()
            nativeAdapter.notifyItemRemoved(index)
            scheduleRecyclerViewLayout()
        }
    }

    override fun dataSourceDidMove(fromIndex: Int, toIndex: Int) {
        runOnMain {
            val nativeAdapter = ensureAdapter()
            nativeAdapter.notifyItemMoved(fromIndex, toIndex)
            scheduleRecyclerViewLayout()
        }
    }

    private fun ensureAdapter(): NativeListAdapter {
        val existingAdapter = adapter
        if (existingAdapter != null) {
            return existingAdapter
        }

        val nativeAdapter = NativeListAdapter(
            reactContext = reactContext,
            createView = { type ->
                createNativeView(type)
            },
            updateView = { reactTag, item, index ->
                val capturedCallback = updateViewCallback
                    ?: throw IllegalStateException("UpdateView callback is not set.")
                capturedCallback(reactTag, item, index)
            }
        )
        nativeAdapter.dataSource = dataSource
        adapter = nativeAdapter
        view.adapter = nativeAdapter
        return nativeAdapter
    }

    private fun createNativeView(type: String): View {
        val capturedCallback = createViewCallback
            ?: throw IllegalStateException("CreateView callback is not set.")

        val viewTag = capturedCallback(type).toInt()
        val fabricUiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
            ?: throw IllegalStateException("Fabric UIManager is null. Is Fabric enabled?")

        val resolvedView = fabricUiManager.resolveView(viewTag)
            ?: throw IllegalStateException("Could not resolve view with tag $viewTag.")

        val parent = resolvedView.parent as? ViewGroup
            ?: throw IllegalStateException("View with tag $viewTag has no parent.")
        val childIndex = parent.indexOfChild(resolvedView)
        parent.removeViewAt(childIndex)

        if (resolvedView.parent != null) {
            throw IllegalStateException("View with tag $viewTag still has a parent after removing.")
        }

        parent.addView(View(reactContext), childIndex)

        return resolvedView
    }

    private fun scheduleRecyclerViewLayout() {
        if (isRecyclerViewLayoutScheduled) {
            return
        }

        isRecyclerViewLayoutScheduled = true
        view.post {
            isRecyclerViewLayoutScheduled = false
            performRecyclerViewLayoutIfReady()
        }
    }

    private fun performRecyclerViewLayoutIfReady() {
        val viewWidth = view.width
        val viewHeight = view.height
        if (!view.isAttachedToWindow || viewWidth <= 0 || viewHeight <= 0) {
            return
        }

        // React Native has already assigned bounds, but RecyclerView requestLayout()
        // is not always traversed from this Fabric-hosted view. Drive RecyclerView's
        // pending adapter updates with the current RN layout.
        val widthSpec = View.MeasureSpec.makeMeasureSpec(viewWidth, View.MeasureSpec.EXACTLY)
        val heightSpec = View.MeasureSpec.makeMeasureSpec(viewHeight, View.MeasureSpec.EXACTLY)
        view.measure(widthSpec, heightSpec)
        view.layout(view.left, view.top, view.right, view.bottom)
    }

    private fun runOnMain(block: () -> Unit) {
        val isMainThread = Looper.myLooper() == Looper.getMainLooper()
        if (isMainThread) {
            block()
        } else {
            view.post(block)
        }
    }

    private class ClippedRecyclerView(context: ThemedReactContext) : RecyclerView(context) {
        override fun dispatchDraw(canvas: Canvas) {
            // RN/Fabric parents may allow child drawing outside their bounds.
            // Keep clipToPadding=false for list insets, but clip rows to the list viewport.
            // Without this item could overflow the list bounds.
            val saveCount = canvas.save()
            canvas.clipRect(0, 0, width, height)
            super.dispatchDraw(canvas)
            canvas.restoreToCount(saveCount)
        }
    }
}
