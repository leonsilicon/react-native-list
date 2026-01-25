import { HybridObject } from 'react-native-nitro-modules'

export interface UiListModule extends HybridObject<{ android: 'kotlin' }> {
  setupExternalSurface(): void
}
