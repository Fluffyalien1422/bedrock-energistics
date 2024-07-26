import { DimensionLocation } from "@minecraft/server";

export function blockLocationToUid(location: DimensionLocation): string {
  return (
    location.dimension.id +
    location.x.toString() +
    location.y.toString() +
    location.z.toString()
  );
}
