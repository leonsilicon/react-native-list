import { HybridObject } from 'react-native-nitro-modules'

export interface IOSWorkletsModuleProxyHolder extends HybridObject<{
  android: 'kotlin'
  ios: 'swift'
}> {}
