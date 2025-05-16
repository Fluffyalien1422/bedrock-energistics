import {
  MachineDefinition,
  NetworkStorageTypeData,
} from "bedrock-energistics-core-api";
import { BlockCustomComponent } from "@minecraft/server";
import { blockLocationToUid } from "../utils/location";

const networkDataMap = new Map<string, Map<string, NetworkStorageTypeData[]>>();

const MAX_DATA_POINTS = 50;

export const networkMonitorMachine: MachineDefinition = {
  description: {
    id: "fluffyalien_energistics:network_monitor",
  },
  events: {
    onNetworkAllocationCompleted(e) {
      const uid = blockLocationToUid(e.blockLocation);
      let networkData = networkDataMap.get(uid);
      if (!networkData) {
        networkData = new Map();
        networkDataMap.set(uid, networkData);
      }

      for (const [key, value] of Object.entries(e.networkData)) {
        const existing = networkData.get(key);
        if (existing) {
          existing.push(value);
          if (existing.length > MAX_DATA_POINTS) {
            existing.shift();
          }
          continue;
        }

        networkData.set(key, [value]);
      }
    },
  },
};

export const networkMonitorComponent: BlockCustomComponent = {
  onPlayerDestroy(e) {
    const uid = blockLocationToUid(e.block);
    networkDataMap.delete(uid);
  },
  onTick(e) {
    const uid = blockLocationToUid(e.block);
    const networkData = networkDataMap.get(uid);
    if (!networkData) return;

    const players = e.dimension
      .getPlayers({
        location: e.block.location,
        maxDistance: 7,
      })
      .filter(
        (player) =>
          player.getBlockFromViewDirection({
            includePermutations: [e.block.permutation],
          })?.block,
      );
    if (!players.length) return;

    const actionbarLines: string[] = [];

    for (const [storageType, dataPoints] of networkData) {
      let beforeSum = 0;
      let afterSum = 0;
      for (const dataPoint of dataPoints) {
        beforeSum += dataPoint.before;
        afterSum += dataPoint.after;
      }

      const lastDataPoint = dataPoints.at(-1)!;

      const avgBefore = Math.round(beforeSum / dataPoints.length);
      const avgAfter = Math.round(afterSum / dataPoints.length);

      actionbarLines.push(
        `§f§l${storageType}§r§7 (avg of last ${dataPoints.length.toString()} allocations): §u${avgBefore.toString()}§r§s -> §u${avgAfter.toString()}`,
        `§f§l${storageType}§r§7 (last allocation): §u${lastDataPoint.before.toString()}§r§s -> §u${lastDataPoint.after.toString()}`,
      );
    }

    const actionbarStr = actionbarLines.join("\n");

    for (const player of players) {
      player.onScreenDisplay.setActionBar(actionbarStr);
    }
  },
};
