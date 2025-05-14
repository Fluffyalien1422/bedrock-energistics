import { DimensionLocation, Entity } from "@minecraft/server";

export function blockLocationToUid(location: DimensionLocation): string {
  return (
    location.dimension.id +
    "," +
    location.x.toString() +
    "," +
    location.y.toString() +
    "," +
    location.z.toString()
  );
}

export function getEntityAtBlockLocation(
  location: DimensionLocation,
  entityTypeId: string,
): Entity | undefined {
  return location.dimension
    .getEntitiesAtBlockLocation(location)
    .find((entity) => entity.typeId === entityTypeId);
}
