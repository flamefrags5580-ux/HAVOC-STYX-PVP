// compass.js
import { world, system, MinecraftItemTypes, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import * as utilities from "./utilities.js";
import * as permissions from "./permissions.js";
import * as duels from "./duels.js";
import * as ffa from "./ffa.js";
import * as clans from "./clans.js";
import * as clanwars from "./clanwars.js";
import * as kits from "./kits.js";
import * as arenas from "./arenas.js";
import * as admin from "./admin.js";

const COMPASS_NAME = "§cHAVOC STYX Menu";
let _registered = false;

function createCompassItem() {
  try {
    const item = new ItemStack(MinecraftItemTypes.compass, 1);
    item.nameTag = COMPASS_NAME;
    return item;
  } catch (e) {
    utilities.error("createCompassItem failed: " + e);
    return null;
  }
}

function giveCompass(player) {
  try {
    if (!player || !player.getComponents) return;
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return;
    for (let i = 0; i < inv.size; i++) {
      const slot = inv.getItem(i);
      if (!slot) continue;
      try {
        if ((slot.typeId || "").includes("compass") && slot.nameTag === COMPASS_NAME) return;
      } catch (e) {}
    }
    const item = createCompassItem();
    if (!item) return;
    const added = inv.addItem(item);
    if (!added) {
      player.runCommandAsync(`give "${player.name}" compass 1`);
    }
  } catch (e) {
    utilities.error("giveCompass failed: " + e);
  }
}

function openMainMenu(player) {
  try {
    const form = new ActionFormData()
      .title("§cHAVOC STYX Menu")
      .body("Select a PvP option")
      .button("⚔ Duel")
      .button("📨 Duel Requests")
      .button("☠ FFA")
      .button("👥 Clans")
      .button("🏆 Clan Wars")
      .button("🎒 Kit Selector")
      .button("🗺 Arena Selector")
      .button("🛠 Admin Tools");

    form.show(player).then(res => {
      if (!res || res.isCanceled) return;
      const idx = res.selection;
      switch (idx) {
        case 0: duels.showChallengeMenu(player); break;
        case 1: duels.showRequestsMenu(player); break;
        case 2: ffa.showFFAMenu(player); break;
        case 3: clans.showClanMenu(player); break;
        case 4: clanwars.showClanWarMenu(player); break;
        case 5: kits.showKitMenu(player); break;
        case 6: arenas.showArenaSelector(player); break;
        case 7:
          if (permissions.isAdmin(player)) admin.showAdminMenu(player);
          else player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cYou are not an administrator."}]}`);
          break;
      }
    }).catch(err => {
      utilities.error("openMainMenu form error: " + err);
    });
  } catch (e) {
    utilities.error("openMainMenu failed: " + e);
  }
}

export function init() {
  if (_registered) return;
  _registered = true;

  world.events.playerJoin.subscribe(ev => {
    try { giveCompass(ev.player); } catch (e) { utilities.error("playerJoin compass failed: " + e); }
  });

  world.events.entityCreate.subscribe(ev => {
    try {
      const ent = ev.entity;
      if (ent && ent.__identifier__ === "minecraft:player") {
        system.runTimeout(() => { try { giveCompass(ent); } catch (e) {} }, 20);
      }
    } catch (e) {}
  });

  world.events.itemUse.subscribe(ev => {
    try {
      const player = ev.source;
      const item = ev.item;
      if (!player || !item) return;
      const isCompass = (item.typeId || "").includes("compass");
      const nameMatches = item.nameTag === COMPASS_NAME;
      if (isCompass && nameMatches) {
        try { ev.cancel = true; } catch (e) {}
        openMainMenu(player);
      }
    } catch (e) {
      utilities.error("itemUse handler error: " + e);
    }
  });

  utilities.log("compass: initialized");
}

export { createCompassItem, giveCompass, openMainMenu };
