/**
 * interface Adapter<ViewTypes extends enum> {
 *  create(
 *      createViewHolder: (viewType: ViewTypes) => ViewHolder,
 *      onBindViewHolder: (viewHolder: ViewHolder, item: any, index: number) -> void,
 *  )
 *
 *  changeDataSet(newDataSet: Array<any>) -> calls notifyDataSetChanged
 *  insertItem(item: any, index: number) -> calls notifyItemInserted
 *  removeItem(index: number) -> calls notifyItemRemoved
 *
 *  // hm
 *  notifyDataSetChanged()
 *  notifyItemInserted(index: number)
 *  notifyItemRemoved(index: number)
 * }
 *
 *  const adapter = Adapter.create(
 *      () => <ViewHolder ... />,
 *      (viewHolder, item, index) => {
 *         viewHolder.text = item.text;
 *      }
 *
 * <RecyclerView
 *  adapter={Adapter}
 * />
 */

import { scheduleOnUI } from 'react-native-worklets'
import { uiListModule } from './UiListModule'
import { uiManagerHelper } from './UiManagerHelper'
import { UiList } from './UiList'

export { Adapter, AdapterFactory } from './specs/Adapter.nitro'
export { ViewHolder } from './specs/ViewHolder.nitro'

// @ts-expect-error shrug
import { setupWorklet } from './ReactFabricMirror.bundle'
import { BoxedHybridObject, NitroModules } from 'react-native-nitro-modules'
import { UiManagerHelper } from './specs/UIManagerHelper.nitro'

// const {get: getViewConfigForType} = ReactNativeViewConfigRegistry;
// scheduleOnUI(() => {
//   'worklet'
//   global.getViewConfigForType = getViewConfigForType // worklet copies this?
// This doesn't do a deep copy no.
// })

// const globalViewConfigMap = (global.rnViewConfigs as Map<string, any>).entries()()
// console.log('Registered view configs:')
// for (const [key, value] of globalViewConfigMap) {
//   console.log(' - ', key, value)
// }

export function setup() {
  uiListModule.setupExternalSurface()
  // const map = global.rnViewConfigs as Map<string, any> | undefined
  // if (!map) {
  //   throw new Error('rnViewConfigs is not defined on global')
  // }
  // console.log(map)
  // const copyConfigs = map.entries().reduce((acc, [key, value]) => {
  //   acc[key] = value
  //   return acc
  // }, {} as Record<string, any>)
  // scheduleOnUI(() => {
  //   'worklet'
  //   global.rnViewConfigs = copyConfigs
  // })

  // TODO: right now we manually fill the objects we need so they become available through `NativeModule.XXX`
  // This should be automatic and work for all modules?
  console.log('nativeModuleProxy:', Object.keys(global.nativeModuleProxy))
  const nativeModuleProxyJS = global.nativeModuleProxy
  const NativeReactNativeFeatureFlagsCxx =
    nativeModuleProxyJS.NativeReactNativeFeatureFlagsCxx
  const PlatformConstants = nativeModuleProxyJS.PlatformConstants

  scheduleOnUI(() => {
    'worklet'

    global.nativeModuleProxy = {
      PlatformConstants,
      NativeReactNativeFeatureFlagsCxx,
    }
  })

  scheduleOnUI(setupWorklet)
}

// TODO: this import doesn't work right now in bundle mode :/
// @ts-expect-error
const capturedOnJS = global.nativeFabricUIManager
let uiManagerHelperBoxed: BoxedHybridObject<UiManagerHelper> =
  NitroModules.box(uiManagerHelper)
export function renderSync() {
  // todo: we might have to pass uiManagerHelper here, or consume from global?
  'worklet'

  const uiManagerHelperUnboxed = uiManagerHelperBoxed.unbox()
  uiManagerHelperUnboxed.renderSync(capturedOnJS)
}

export { UiList, uiListModule, uiManagerHelper }
