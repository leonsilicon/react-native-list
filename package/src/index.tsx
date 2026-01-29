/**
 *
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
 *
 */

import { getHostComponent, NitroModules } from 'react-native-nitro-modules'
import { UiListModule } from './specs/UIListModule.nitro'
import { UiManagerHelper } from './specs/UIManagerHelper.nitro'
import { UiListViewMethods, UiListViewProps } from './specs/UiListView.nitro'
import UiListViewConfig from '../nitrogen/generated/shared/json/UiListViewConfig.json'
import { scheduleOnUI } from 'react-native-worklets'
// @ts-expect-error shrug
import { setupWorklet } from './ReactFabricMirror.bundle'

export { Adapter, AdapterFactory } from './specs/Adapter.nitro'
export { ViewHolder } from './specs/ViewHolder.nitro'

const {
  ReactNativeViewConfigRegistry,
  // deepFreezeAndThrowOnMutationInDev,
  // createPublicInstance,
  // createPublicTextInstance,
  createAttributePayload,
  diffAttributePayloads,
  // type PublicInstance as ReactNativePublicInstance,
  // type PublicTextInstance,
  // type PublicRootInstance,
} = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

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

export const uiListModule =
  NitroModules.createHybridObject<UiListModule>('UiListModule')
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

  scheduleOnUI(setupWorklet)
}

const uiManagerHelper =
  NitroModules.createHybridObject<UiManagerHelper>('UiManagerHelper')

// @ts-expect-error
const captured = nativeFabricUIManager
export function renderSync() {
  'worklet'

  uiManagerHelper.renderSync(captured)
}

export const UiList = getHostComponent<UiListViewProps, UiListViewMethods>(
  'UiListView',
  () => UiListViewConfig
)
