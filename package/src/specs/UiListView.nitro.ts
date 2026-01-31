import {
  // HybridObject,
  HybridView,
  HybridViewMethods,
  HybridViewProps,
  Sync,
} from 'react-native-nitro-modules'
import { UiListModule } from './UIListModule.nitro'
// import { ViewHolder } from './ViewHolder.nitro'

export interface UiListViewProps extends HybridViewProps {
  // makeNativeViewCallback: Sync<() => ViewHolder>
}

export interface UiListViewMethods extends HybridViewMethods {
  setMakeNativeViewCallback(
    uiListModule: UiListModule,
    callback: Sync<() => number>
  ): void

  // TODO: maybe we can combine with make function?
  setUpdateViewCallback(
    uiListModule: UiListModule,
    // This callback should issue update operations on the existing view!
    callback: Sync<
      (
        reactTag: number,
        index: number
        // TODO: view type i guess
        // TODO: data
      ) => boolean // we have to return something to make nitro work
    >
  ): void
}

export type UiListView = HybridView<UiListViewProps, UiListViewMethods>

// export interface CallbackHolder extends HybridObject<{ android: 'kotlin' }> {
//   invokeCallback(): void
// }
