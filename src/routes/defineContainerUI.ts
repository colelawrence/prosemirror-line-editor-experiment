import type { TeardownLogic } from "rxjs";
import type { InferValues, MinttyHTMLFn, MinttyValuesConfig } from "./defineUI";
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
    mount(mountTo: {
      container: HTMLElement;
      save(values: Partial<InferSlotItemValues<Slots, "hmmm">>): Promise<void>;
    }): {
      // hypothetically...
      on: {
        [P in keyof MinterChildEvents]: (
          listener: (event: MinterChildEvents[P]) => PromiseLike<void>
        ) => TeardownLogic;
      };
      selectAll(): Outcome;
    };
  }
>;

export interface MinttyWebContainerFn<
  Config extends MinttyValuesConfig & MinttySlotsConfig
> {
  (options: {
    /** initial values on the container */
    values: InferValues<Config>;
    slots: InferSlotsForWeb<Config>;
    // // duplicates slots?
    // mountTo: {
    //   container: HTMLElement;
    //   save(values: Partial<InferSlotItemValues<Slots, "hmmm">>): Promise<void>;
    // }
  }): {
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
    testData(data: TestBlockData<Config>) {
      return {
        forHTML(options: {
          // In the future, we will need to return an id
          pickHTMLUI: (options: {
            itemTestData: TestBlockData<any>;
          }) => MinttyHTMLFn<any>;
        }): MinttyHTMLContainerFnInput<Config> {
          return {
            slots:
              data.slots &&
              objMap(data.slots, (slotItemList) =>
                slotItemList.map((slotItem) => ({
                  miid: slotItem.miid,
                  standoffValues: slotItem.standoffValues,
                  ...options.pickHTMLUI({
                    itemTestData: slotItem.linkedBlockData,
                  })(slotItem.linkedBlockData.values),
                }))
              ),
            values: data.values, // objMap(data.values, (value) => objMap(value, format => )),
          };
        },
      };
    },
    _slotHTMLTypes: justForTypeScript as InferSlotsForHTML<Config>,
    _slotWebTypes: justForTypeScript as InferSlotsForWeb<Config>,
  };
}
