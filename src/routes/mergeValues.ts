import type { InferValues } from "./MinttyValuesConfig.type";

export function mergeValues(...valuesToMerge: InferValues<any>[]) {
  const mergeInto: InferValues<any> = {};
  for (const item of valuesToMerge) {
    for (const valueKey in item) {
      const formatsMap = (mergeInto[valueKey] = mergeInto[valueKey] ?? {});
      for (const formatKey in item[valueKey]) {
        formatsMap[formatKey] = item[valueKey][formatKey];
      }
    }
  }

  return mergeInto;
}
