import { NitroModules } from 'react-native-nitro-modules'
import { UiListModule } from './specs/UIListModule.nitro'

export const uiListModule =
  NitroModules.createHybridObject<UiListModule>('UiListModule')
