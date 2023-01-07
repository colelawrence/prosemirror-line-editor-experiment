import type { TeardownLogic } from "rxjs";
import type {
  InferValues,
  MinttyHTMLFn,
  MinttyValuesConfig,
  MinttyWebFn,
} from "./defineUI";
import type { TestBlockData } from "./TestBlockData";
import { objMap } from "./objMap";

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
  {
    destroy(): void;
    apply(update: Partial<InferValues<any>>): void;
    // mount(mountTo: {
    //   container: HTMLElement;
    //   save(values: Partial<InferSlotItemValues<Slots, "hmmm">>): Promise<void>;
    // }): {
    //   // hypothetically...
    //   on: {
    //     [P in keyof MinterChildEvents]: (
    //       listener: (event: MinterChildEvents[P]) => PromiseLike<void>
    //     ) => TeardownLogic;
    //   };
    //   selectAll(): Outcome;
    // };
  }
>;
type MountToInput<Config extends MinttyValuesConfig & MinttySlotsConfig> = {
  container: HTMLElement;
  save(values: Partial<InferValues<Config>>): Promise<void>;
  // saveStandOffProperties?
  // events?
};

export interface MinttyWebContainerFnInput<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  /** initial values on the container */
  values: InferValues<Config>;
  slots: InferSlotsForWeb<Config>;
  mountTo: MountToInput<Config>;
}
export interface MinttyWebContainerFn<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  (options: MinttyWebContainerFnInput<Config>): {
    destroy(): void;
    apply(values: Partial<InferValues<Config>>): void;
    applyItemStandoff(
      values: Partial<
        InferSlotItemValues<Config, { updateItemAtIndex: number }>
      >
    ): void;
  };
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
  html: MinttyHTMLFn<any>;
  web: MinttyWebFn<any>;
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

export function renderContainerForWeb<
  Config extends MinttyValuesConfig & MinttySlotsConfig
>(options: {
  // In the future, we will need to return an id
  pickUI: PickUIFn;
  data: TestBlockData<Config>;
  mountTo: MountToInput<Config>;
}): MinttyWebContainerFnInput<Config> {
  return {
    slots: objMap(options.data.slots, (slotItemList) =>
      slotItemList.map((slotItem, idx) => ({
        miid: slotItem.miid,
        standoffValues: slotItem.standoffValues,
        ...options
          .pickUI({
            itemTestData: slotItem.linkedBlockData,
          })
          .web(slotItem.linkedBlockData.values, {
            // hmmm...
            container: document.getElementById(
              `i-${slotItem.miid}-${idx}`
            ) as HTMLElement,
            async save(values) {
              console.log(`TODO: save ${slotItem.miid}`, values);
            },
          }),
      }))
    ),
    values: options.data.values, // objMap(data.values, (value) => objMap(value, format => )),
    mountTo: options.mountTo,
  };
}
