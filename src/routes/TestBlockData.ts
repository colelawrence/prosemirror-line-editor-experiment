import type { BlockData } from "./BlockData";
import type { MinttySlotsConfig } from "./defineContainerUI";
import type { MinttyValuesConfig } from "./defineUI";

/** Test blocks include all nested blocks' data */
export type TestBlockData<
  Config extends MinttyValuesConfig & MinttySlotsConfig = {
    values: {};
    slots: {};
  }
> = BlockData<
  Config,
  // every slot item includes it's test block data.
  // this would typically be stored elsewhere
  {
    /** Includes nested block data for {@link TestBlockData} structures. */
    linkedBlockData: TestBlockData<any>;
  }
>;
