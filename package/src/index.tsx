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

export function setup() {
  uiListModule.setupExternalSurface()

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
