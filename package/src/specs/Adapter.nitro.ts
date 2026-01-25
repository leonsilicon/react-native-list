import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
import type { ViewHolder } from './ViewHolder.nitro'

export interface Adapter extends HybridObject<{ android: 'kotlin' }> {
  changeDataSet(newDataSet: AnyMap[]): void
  insertItem(item: AnyMap, index: number): void
  changeItem(item: AnyMap, index: number): void
  removeItem(index: number): void
}

export interface AdapterFactory extends HybridObject<{ android: 'kotlin' }> {
  create(
    // TODO: the functions passed here must be worklets
    // and those worklets must render JSX and return us a real element
    // haha how the fuck should that work
    // 99% sure that must be possible
    // We could render something with JS and return the shadow node ref and try to find that in the view registry
    // the problem is that this flow is async
    // and here we basically want to create views sync on the UI thread, which for all purposes and intents should be possible
    // think
    // lets first if we can run simple JSX in worklets!
    // oh wait, the nice part is that we really only need to create the ViewHolder, no?
    createViewHolder: (viewType: number) => ViewHolder,
    onBindViewHolder: (
      viewHolder: ViewHolder,
      item: AnyMap,
      index: number
    ) => void
  ): Adapter
}
