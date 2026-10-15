// ffa.js
import { ActionFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import * as storage from "./storage.js";
import * as kits from "./kits.js";
import * as arenas from "./arenas.js";
import * as utilities from "./utilities.js";

const ffaplayers = new Set();

export function init() { utilities.log("ffa: initialized"); }

export function showFFAMenu(player) {
  const form = new ActionFormData().title("§cFFA Menu").body("Join or leave FFA").button("Join FFA").button("Leave FFA");
  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    if (res.selection === 0) joinFFA(player); else leaveFFA(player);
  });
}

export function joinFFA(player) {
  if (ffaplayers.has(player.name)) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7You are already in FFA."}]}`);
    return;
  }

  const arena = (storage.getArenas() || []).find(a => a.modes && a.modes.includes("FFA")) || (storage.getArenas()[0] || null);
  if (!arena) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cNo FFA arenas configured."}]}`);
    return;
  }

  const kit = (storage.getKits() || [])[0];
  arenas.teleportToArenaSpawn(player, arena, 0, 0);
  if (kit) kits.applyKitToPlayer(player, kit);
  ffaplayers.add(player.name);
  player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§aYou joined FFA (${arena.name})."}]}`);
}

export function leaveFFA(player) {
  if (!ffaplayers.has(player.name)) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7You are not in FFA."}]}`);
    return;
  }
  ffaplayers.delete(player.name);
  try {
    const spawn = world.getDimension("overworld").getSpawnLocation();
    player.teleport(spawn);
  } catch (e) {}
  player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§aYou left FFA."}]}`);
}
