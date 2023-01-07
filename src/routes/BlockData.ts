import {
  InferSlotItemValues,
  MinttySlotsConfig
} from "./defineContainerUI";
import { MinttyValuesConfig, InferValues } from "./defineUI";


export type BlockData<
  Config extends MinttyValuesConfig & MinttySlotsConfig = {
    values: {};
    slots: {};
  },
  LinkedBlock extends { linkedBlockData?: any; } = {}
> = {
  values: InferValues<Config>;
  slots: InferSlotItemValues<Config, LinkedBlock>;
};
