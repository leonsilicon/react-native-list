// import type { ColorValue } from "react-native";
import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules'

export interface ViewHolderProps extends HybridViewProps {}

export interface ViewHolderMethods extends HybridViewMethods {}
export type ViewHolder = HybridView<ViewHolderProps, ViewHolderMethods>