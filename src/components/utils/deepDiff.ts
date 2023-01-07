/** @copyright Cole Lawrence, GPL 2022 */
/**
 * Check the equality of anything
 *
 * **Example return**
 *
 *    { "permissions.foo": [{}, { "a": 1 }] }
 *
 * @returns list of differences in tuple [<path>, <a>, <b>]
 */
export function deepDiff(obj1: any, obj2: any): { [path: string]: [any, any] } {
  return deepDiffR(obj1, obj2, []).reduce(
    (acc, [path, a, b]) => ({
      ...acc,
      [path.join(".")]: [a, b],
    }),
    {},
  )
}

/**
 * @internal
 * Check the equality of anything
 * @returns list of differences in tuple [<path>, <a>, <b>]
 */
function deepDiffR(
  obj1: any,
  obj2: any,
  path: (string | number | symbol)[],
): [(string | number | symbol)[], any, any][] {
  if (obj1 === obj2) {
    return []
  }

  if (isObject(obj1) && isObject(obj2)) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
      return [[path, obj1, obj2]]
    }

    const diffs: ReturnType<typeof deepDiffR> = []
    for (const prop in obj1) {
      diffs.push(...deepDiffR(obj1[prop], obj2[prop], [...path, prop]))
    }

    return diffs
  }

  return [[path, obj1, obj2]]
}
/**
 * @internal
 */
function isObject(obj: any): obj is { [key: string]: any; [keyN: number]: any } {
  return typeof obj === "object" && obj != null
}
