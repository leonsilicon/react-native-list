import { Text, View } from "react-native";
import {scheduleOnUI} from "react-native-worklets"
import {NitroModules} from "react-native-nitro-modules"
import {AdapterFactory, ViewHolder} from "react-native-nitro-list"

// function WorkletFunction() {
//     "worklet"

//     function MyComponentOnTheUIThread() {
//         return <View><Text></Text></View> // i don't thin k this will work
//     }

//     const res = <MyComponentOnTheUIThread />
//     console.log("Rendered on UI thread:", res)
//     return res;
// }

// scheduleOnUI(WorkletFunction)

const AdapterFactoryInstance = NitroModules.createHybridObject<AdapterFactory>('AdapterFactory')
const adapter = AdapterFactoryInstance.create(
    (viewType: number) => {
        const viewHolder = NitroModules.createHybridObject<ViewHolder>('ViewHolder')
        return viewHolder
    },
    (viewHolder: ViewHolder, item: any, index: number) => {
        // bind data to viewHolder
    }
)

console.log("Adapter created:", adapter)

function worklet() {
    "worklet"
    global.tagCounter = (global.tagCounter ?? 300) + 2

    const capture = nativeFabricUIManager.createNode(
        global.tagCounter, // tag
        "RCTView",
        0, // surfaceId, can we create a new one?
           // creating a new container would mean no context hm
        {
            backgroundColor: "#ff0000",
            width: '100%',
            height: 50,
            borderWidth: 2,
        }, // props
        {} // instanceHandle
    )
    console.log("Created node with id " + global.tagCounter)
    // problem: pre-create is not sync, so the native view is not there yet.
    // we could force to run it though with notifyDelegates

    // if we do this through the uiManager then we should also be able to run updates through it…
}
scheduleOnUI(worklet)

adapter.changeDataSet([{id: 1}, {id: 2}, {id: 3}])
// I imagine that this must be either called on the UI thread, or its async, so potentially return promise here?
// But i guess async is really fine, as you don't care that much about when the list re-renders, just that it does :sweat_smile:
// On the other hand we want to make sure that first render has data, so probably we want to provide an initial data creator

export default function App() {
    // i like me better when i am with you

    return <View></View>
}