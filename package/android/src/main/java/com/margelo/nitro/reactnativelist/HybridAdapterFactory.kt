package com.margelo.nitro.reactnativelist

import com.margelo.nitro.core.AnyMap
import com.margelo.nitro.core.Promise

class HybridAdapterFactory : HybridAdapterFactorySpec() {
    override fun create(
        createViewHolder: (viewType: Double) -> Promise<HybridViewHolderSpec>,
        onBindViewHolder: (viewHolder: HybridViewHolderSpec, item: AnyMap, index: Double) -> Unit
    ): HybridAdapterSpec {
        return HybridAdapter()
    }
}