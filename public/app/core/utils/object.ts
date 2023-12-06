import { isArray, isPlainObject } from 'lodash';

/** @returns a deep clone of the object, but with any null value removed */
export function sortedDeepCloneWithoutNulls<T extends {}>(value: T): T {
  if (isArray(value)) {
    return value.map(sortedDeepCloneWithoutNulls) as unknown as T;
  }
  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        const v = (value as any)[key];
        if (v != null) {
          acc[key] = sortedDeepCloneWithoutNulls(v);
        }
        return acc;
      }, {});
  }
  return value;
}

export function getCircularReplacer() {
  const seen = new WeakSet();

  return (_key: string, value: object | null) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export const createSafeObject = <T>(x: T) => x && JSON.parse(JSON.stringify(x, getCircularReplacer()));
