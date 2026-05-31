import { NativeListLayout } from './NativeListLayout.nitro'

export interface NativeItemSizeEstimate {
  width?: number
  height?: number
}

export interface NativeLinearListLayoutIOSConfig {
  estimatedItemSize?: NativeItemSizeEstimate
}

export interface NativeLinearListLayoutConfig {
  topInset: number
  bottomInset: number
  itemSpacing: number
  itemHorizontalInset: number
  itemVerticalInset: number
  iosConfig?: NativeLinearListLayoutIOSConfig
}

export interface NativeLinearListLayout extends NativeListLayout {
  setConfig(config: NativeLinearListLayoutConfig): void
}
