// arenas.js
import { ActionFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";

export function init() {
  const a = storage.getArenas();
  if (!a) storage.setArenas([]);
  utilities.log("arenas: initialized");
}

export function listArenas() {
  return storage.getArenas() || [];
}

export function showArenaSelector(player, filter = null, onSelect = null) {
  const arenas = listArenas();
  const form = new ActionFormData().title("§cArena Selector").body("Choose arena");
  if (arenas.length === 0) {
    form.button("No arenas available");
    form.show(player);
    return;
  }

  let entries = [];
  for (const a of arenas) {
    if (!a.enabled) continue;
    if (filter && filter.mode && !a.modes.includes(filter.mode)) continue;
    entries.push(a);
    form.button(a.name);
  }

  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    const sel = entries[res.selection];
    if (sel && onSelect) onSelect(sel);
  }).catch(e => utilities.error("showArenaSelector: " + e));
}

export function teleportToArenaSpawn(player, arena, teamIndex = 0, slotIndex = 0) {
  try {
    if (!arena || !player) return false;
    const dim = world.getDimension("overworld");
    const spawns = (arena.teamSpawns && arena.teamSpawns[teamIndex]) || arena.spawns;
    if (!spawns || spawns.length === 0) return false;
    const spawn = spawns[slotIndex % spawns.length];
    if (!spawn) return false;
    player.teleport(spawn, dim, 0, 0);
    return true;
  } catch (e) {
    utilities.error("teleportToArenaSpawn: " + e);
    return false;
  }
}
