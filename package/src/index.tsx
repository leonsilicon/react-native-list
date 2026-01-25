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

export { Adapter, AdapterFactory } from './specs/Adapter.nitro'
export { ViewHolder } from './specs/ViewHolder.nitro'