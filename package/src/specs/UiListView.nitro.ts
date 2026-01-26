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
}

export type UiListView = HybridView<UiListViewProps, UiListViewMethods>

// export interface CallbackHolder extends HybridObject<{ android: 'kotlin' }> {
//   invokeCallback(): void
// }
