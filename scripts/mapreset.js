// mapreset.js
import { world } from "@minecraft/server";
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";

const savedRegions = new Map();

export function init() {
  const arenas = storage.getArenas();
  if (!arenas) return;
  utilities.log("mapreset: initialized");
}

export function snapshotArenaRegion(arenaName, minPos, maxPos) {
  try {
    const blocks = [];
    const dim = world.getDimension("overworld");
    for (let x = minPos.x; x <= maxPos.x; x++) {
      for (let y = minPos.y; y <= maxPos.y; y++) {
        for (let z = minPos.z; z <= maxPos.z; z++) {
          try {
            const block = dim.getBlock({ x, y, z });
            blocks.push({ x, y, z, id: block.id });
          } catch (e) {}
        }
      }
    }
    savedRegions.set(arenaName, blocks);
    return true;
  } catch (e) {
    utilities.error("snapshotArenaRegion failed: " + e);
    return false;
  }
}

export function resetArenaRegion(arenaName) {
  try {
    const blocks = savedRegions.get(arenaName);
    if (!blocks) return false;
    const dim = world.getDimension("overworld");
    for (const b of blocks) {
      try { dim.runCommandAsync(`setblock ${b.x} ${b.y} ${b.z} ${b.id}`); } catch (e) {}
    }
    return true;
  } catch (e) {
    utilities.error("resetArenaRegion failed: " + e);
    return false;
  }
}
