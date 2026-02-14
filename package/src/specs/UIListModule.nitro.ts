import { HybridObject } from 'react-native-nitro-modules'
// import { ViewHolder } from './ViewHolder.nitro'

export interface UiListModule extends HybridObject<{
  android: 'kotlin'
  ios: 'swift'
}> {
  setupExternalSurface(): void
  //   renderAndGetView(tag: number): ViewHolder
}
