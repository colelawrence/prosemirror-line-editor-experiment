import type {
  InferValues,
  MinttyHTMLFn,
  MinttyValuesConfig,
  MinttyMountFn,
  MinttyWebFn,
} from "./defineUI";
import type { TestBlockData } from "./TestBlockData";
import { objMap } from "../components/utils/objMap";
import type { TeardownLogic } from "rxjs";
import { createErrorObj, dev } from "@autoplay/utils";

enum Outcome {
  Passthrough = 0,
  Handled = 1,
}

/**
 * Slots
 *
 * Progress 0/10:
 *  * I want to be able to statically say "I can render these children if they..."
 *  * Those children could be whiteboard elements or they could be line items, or
 *    to-do list tasks.
 *  * Example: If the children were to-do list tasks, then the parent
 *    could have its own UI for filtering whether to show the items which are done
 *    or not.
 *
 * See Slot Props in Vue.js https://youtu.be/emi436qg9mg?t=431
 */
export interface MinttySlotsConfig {
  slots: {
    [slotName: string]: {
      /** Item stand-off properties managed by the container */
      itemStandoffValues: MinttyValuesConfig;
      // Assume a slot can always hold multiple
      /** can hold multiple */
      multiple: true;
    };
  };
}

type MintterItemID = string;

export type InferSlotItemValues<
  Slots extends MinttySlotsConfig,
  ExtendWith = {}
> = {
  [P in keyof Slots["slots"]]: Array<
    ExtendWith & {
      miid: MintterItemID;
      /** Specified by the container */
      standoffValues: InferValues<Slots["slots"][P]["itemStandoffValues"]>;
    }
  >;
};

export interface MinttyHTMLContainerUI<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  config: Config;
  html: MinttyHTMLContainerFn<Config>;
}

type InferSlotsForHTML<Slots extends MinttySlotsConfig> = InferSlotItemValues<
  Slots,
  // each slot item will include the following:
  {
    css?: string;
    html: string;
  }
>;

export interface MinttyHTMLContainerFnInput<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  /** initial values on the container */
  values: InferValues<Config>;
  /** initial values and html and css per item HTML */
  slots: InferSlotsForHTML<Config>;
}
export interface MinttyHTMLContainerFn<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  (options: MinttyHTMLContainerFnInput<Config>): {
    css?: string;
    html: string;
  };
}

// interface MintterEventInfoConfig {
//   detail: Parser<any>;
// }

interface MintterEvent<Type extends string, DetailType> extends Event {
  type: `mintter:${Type}`;
  detail: DetailType;
}

type MinterChildEvents = {
  selectAll: MintterEvent<
    "select-all",
    {
      /** this event extends */
      exiting: null | { direction: "up" | "down" | "left" | "right" };
    }
  >;
  cursorExit: MintterEvent<
    "cursor-exit",
    { direction: "up" | "down" | "left" | "right" }
  >;
};

type InferSlotsForWeb<Slots extends MinttySlotsConfig> = InferSlotItemValues<
  Slots,
  { mount: MinttyMountFn }
>;

export interface MinttyWebContainerFnInput<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  /** initial values on the container */
  values: InferValues<Config>;
  slots: InferSlotsForWeb<Config>;
  save(values: Partial<InferValues<Config>>): Promise<void>;
}

type MinttyWebContainerFnResult<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> = {
  // HMMM?
  // applyItemStandoff(
  //   values: Partial<
  //     InferSlotItemValues<Config, { updateItemAtIndex: number }>
  //   >
  // ): void;
  apply(values: Partial<InferValues<Config>>): void;
  mount: MinttyMountFn;
};

export interface MinttyWebContainerFn<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  (
    options: MinttyWebContainerFnInput<Config>
  ): MinttyWebContainerFnResult<Config>;
}
export interface MinttyWebContainerUI<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  config: Config;
  web: MinttyWebContainerFn<Config>;
}

/** use for keys that should not be accesed from runtime */
const justForTypeScript = Symbol.for("just for typescript") as any;

export type PickUIFn = (options: { itemTestData: TestBlockData<any> }) => {
  html: MinttyHTMLContainerFn<any>;
  web: MinttyWebContainerFn<any>;
};

export function defineContainerUI<
  Config extends MinttyValuesConfig & MinttySlotsConfig
>(config: Config) {
  return {
    forHTML(
      html: MinttyHTMLContainerFn<Config>
    ): MinttyHTMLContainerUI<Config> {
      return {
        config,
        html,
      };
    },
    forWeb(web: MinttyWebContainerFn<Config>): MinttyWebContainerUI<Config> {
      return {
        config,
        web,
      };
    },
    testData(data: TestBlockData<Config>): TestBlockData<Config> {
      return data;
    },
    _valueType: justForTypeScript as InferValues<Config>,
    _slotHTMLTypes: justForTypeScript as InferSlotsForHTML<Config>,
    _slotWebTypes: justForTypeScript as InferSlotsForWeb<Config>,
  };
}
export function renderContainerForHTML<
  Config extends MinttyValuesConfig & MinttySlotsConfig
>(options: {
  pickUI: PickUIFn;
  data: TestBlockData<Config>;
}): MinttyHTMLContainerFnInput<Config> {
  return {
    slots: objMap(options.data.slots, (slotItemList) =>
      slotItemList.map((slotItem, idx) => ({
        miid: slotItem.miid,
        standoffValues: slotItem.standoffValues,
        ...options
          .pickUI({
            itemTestData: slotItem.linkedBlockData,
          })
          .html({
            slots: createErrorObj(
              dev`Access slots for html of embedded ${slotItem.linkedBlockData.slots}`
            ),
            values: slotItem.linkedBlockData.values,
            // IDEA: Some way to attach everything together without full container + slots hydration?
            // If this isn't plausible, we probably need to completely rewrite around Qwik.
            // bindHTMLId: `i-${slotItem.miid}-${idx}`,
          }),
      }))
    ),
    values: options.data.values, // objMap(data.values, (value) => objMap(value, format => )),
  };
}

export function createUIStateForWeb<
  Config extends MinttyValuesConfig & MinttySlotsConfig
>(options: {
  // In the future, we will need to return an id
  pickUI: PickUIFn;
  data: TestBlockData<Config>;
  TODO_Save: null; // MountToInput<Config>;
}): MinttyWebContainerFnResult<Config> {
  const input: MinttyWebContainerFnInput<Config> = {
    slots: objMap(options.data.slots, (slotItemList) =>
      slotItemList.map((slotItem, idx) => ({
        miid: slotItem.miid,
        standoffValues: slotItem.standoffValues,
        mount: createUIStateForWeb({
          pickUI: options.pickUI,
          data: slotItem.linkedBlockData,
          TODO_Save: options.TODO_Save,
        }).mount, // TODO: where does apply() go?
        // ...createUIStateForWeb({
        //   data: slotItem.linkedBlockData,
        //   pickUI: options.pickUI,
        //   TODO_Save: null
        // })
        // // TODO: connect the apply()
        // mount: options
        //   .pickUI({
        //     itemTestData: slotItem.linkedBlockData,
        //   })
        //   .web({
        //     async save(values) {
        //       console.warn("TODO save", values);
        //     },
        //     values: slotItem.linkedBlockData.values,
        //     slots: slotItem.linkedBlockData.slots,
        //   }).mount,
      }))
    ),
    values: options.data.values, // objMap(data.values, (value) => objMap(value, format => )),
    async save(values) {
      console.warn("TODO save values?", values);
    },
  };
  const { web } = options.pickUI({ itemTestData: options.data });
  return web(input);
}
