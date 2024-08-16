export function weightedRandom<T extends string | number>(
  choices: Record<T, number>,
): T {
  const items = Object.keys(choices) as T[];
  const weights = Object.values<number>(choices);

  for (let i = 1; i < weights.length; i++) {
    weights[i] += weights[i - 1];
  }

  const random = Math.random() * weights[weights.length - 1];

  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > random) {
      return items[i];
    }
  }

  return items[0];
}
