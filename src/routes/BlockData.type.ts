import type { InferSlotItemValues, MinttySlotsConfig } from "./defineItemSchema";
import type { MinttyValuesConfig, InferValues } from "./MinttyValuesConfig.type";

export type BlockData<
  Config extends MinttyValuesConfig & MinttySlotsConfig = {
    values: {};
    slots: {};
  },
  LinkedBlock extends { linkedBlockData?: any } = {}
> = {
  values: InferValues<Config>;
  slots: InferSlotItemValues<Config, LinkedBlock>;
};
