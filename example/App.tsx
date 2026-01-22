import { Text, View } from "react-native";
import {scheduleOnUI} from "react-native-worklets"

function WorkletFunction() {
    "worklet"

    function MyComponentOnTheUIThread() {
        return <View><Text></Text></View> // i don't thin k this will work
    }

    const res = <MyComponentOnTheUIThread />
    console.log("Rendered on UI thread:", res)
    return res;
}

scheduleOnUI(WorkletFunction)

export default function App() {
    // i like me better when i am with you

    return <View></View>
}