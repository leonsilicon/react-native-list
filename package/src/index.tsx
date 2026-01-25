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

import { NitroModules } from 'react-native-nitro-modules'
import { UiListModule } from './specs/UIListModule.nitro'
import { UiManagerHelper } from './specs/UIManagerHelper.nitro'

export { Adapter, AdapterFactory } from './specs/Adapter.nitro'
export { ViewHolder } from './specs/ViewHolder.nitro'

const uiListModule =
  NitroModules.createHybridObject<UiListModule>('UiListModule')
export function dafuq() {
  uiListModule.setupExternalSurface()
  console.log('UIListModule initialized')
}

const uiManagerHelper =
  NitroModules.createHybridObject<UiManagerHelper>('UiManagerHelper')

const captured = nativeFabricUIManager
export function renderSync() {
  'worklet'

  console.log('renderSync() with nativeFabricUIManager: ', captured)
  uiManagerHelper.renderSync(
    // worklets is somehow getting that from the JS runtime into the global of this one, which i am cool with
    captured
  )
  console.log('renderSync() done')
}
