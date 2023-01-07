import type { TeardownLogic } from "rxjs";
import type { InferValues, MinttyValuesConfig } from "./defineUI";

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

type InferSlotItemValues<Slots extends MinttySlotsConfig, ExtendWith = {}> = {
  [P in keyof Slots["slots"]]: Array<
    ExtendWith & {
      miid: MintterItemID;
      /** Specified by the container */
      standoffValues: InferValues<Slots["slots"][P]["itemStandoffValues"]>;
    }
  >;
};

export interface MinttyHTMLContainerUI<
  Values extends MinttyValuesConfig,
  Slots extends MinttySlotsConfig
> {
  slots: Slots;
  values: Values;
  html: MinttyHTMLContainerFn<Values, Slots>;
}

type InferSlotsForHTML<Slots extends MinttySlotsConfig> = InferSlotItemValues<
  Slots,
  // each slot item will include the following:
  {
    css?: string;
    html: string;
  }
>;

export interface MinttyHTMLContainerFn<
  Values extends MinttyValuesConfig,
  Slots extends MinttySlotsConfig
> {
  (options: {
    /** initial values on the container */
    values: InferValues<Values>;
    /** initial values and html and css per item HTML */
    slots: InferSlotsForHTML<Slots>;
  }): {
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
  Values extends MinttyValuesConfig,
  Slots extends MinttySlotsConfig
> {
  (options: {
    /** initial values on the container */
    values: InferValues<Values>;
    slots: InferSlotsForWeb<Slots>;
    // // duplicates slots?
    // mountTo: {
    //   container: HTMLElement;
    //   save(values: Partial<InferSlotItemValues<Slots, "hmmm">>): Promise<void>;
    // }
  }): {
    destroy(): void;
    apply(values: Partial<InferValues<Values>>): void;
    applyItemStandoff(
      values: Partial<InferSlotItemValues<Slots, { updateItemAtIndex: number }>>
    ): void;
  };
}

export interface MinttyWebContainerUI<
  Values extends MinttyValuesConfig,
  Slots extends MinttySlotsConfig
> {
  values: Values;
  slots: Slots;
  web: MinttyWebContainerFn<Values, Slots>;
}

/** use for keys that should not be accesed from runtime */
const justForTypeScript = Symbol.for("just for typescript") as any;

export function defineContainerUI<
  Values extends MinttyValuesConfig,
  Slots extends MinttySlotsConfig
>(config: { self: Values; content: Slots }) {
  return {
    forHTML(
      html: MinttyHTMLContainerFn<Values, Slots>
    ): MinttyHTMLContainerUI<Values, Slots> {
      return {
        values: config.self,
        slots: config.content,
        html,
      };
    },
    forWeb(
      web: MinttyWebContainerFn<Values, Slots>
    ): MinttyWebContainerUI<Values, Slots> {
      return {
        values: config.self,
        slots: config.content,
        web,
      };
    },
    _slotHTMLTypes: justForTypeScript as InferSlotsForHTML<Slots>,
    _slotWebTypes: justForTypeScript as InferSlotsForWeb<Slots>,
  };
}
