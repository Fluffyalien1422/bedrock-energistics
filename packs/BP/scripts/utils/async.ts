export async function arraySomeAsync<T>(
  arr: T[],
  predicate: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<boolean> {
  for (let i = 0; i < arr.length; i++) {
    if (await predicate(arr[i], i, arr)) {
      return true;
    }
  }

  return false;
}
