// kits.js
import { ActionFormData } from "@minecraft/server-ui";
import { ItemStack, MinecraftItemTypes } from "@minecraft/server";
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";

export function init() {
  const kits = storage.getKits();
  if (!kits || !Array.isArray(kits)) storage.setKits([]);
  utilities.log("kits: initialized");
}

export function showKitMenu(player, allowedList = null, onSelect = null) {
  const kits = storage.getKits() || [];
  const form = new ActionFormData().title("§cKits").body("Select a kit");

  if (kits.length === 0) {
    form.button("No kits available");
    form.show(player).then(() => {});
    return;
  }

  const valid = kits.filter(k => !allowedList || allowedList.includes(k.name));
  valid.forEach(k => form.button(k.icon || "🎒 " + k.name));

  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    const selected = valid[res.selection];
    if (selected && onSelect) onSelect(selected);
  });
}

export function applyKitToPlayer(player, kit) {
  try {
    if (!player || !kit) return false;
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return false;
    try { inv.clear(); } catch (e) {}

    if (Array.isArray(kit.items)) {
      for (const it of kit.items) {
        try {
          const type = MinecraftItemTypes[it.id.replace("minecraft:", "").replace(/-/g, "_").toUpperCase()] || MinecraftItemTypes.diamond_sword;
          try {
            const stack = new ItemStack(type, it.count || 1);
            inv.addItem(stack);
          } catch (e) {
            player.runCommandAsync(`give "${player.name}" ${it.id} ${it.count || 1}`);
          }
        } catch (e) {}
      }
    }

    if (kit.armor && typeof kit.armor === "object") {
      try {
        if (kit.armor.helmet) player.runCommandAsync(`replaceitem entity "${player.name}" slot.armor.head ${kit.armor.helmet} 1`);
        if (kit.armor.chestplate) player.runCommandAsync(`replaceitem entity "${player.name}" slot.armor.chest ${kit.armor.chestplate} 1`);
        if (kit.armor.leggings) player.runCommandAsync(`replaceitem entity "${player.name}" slot.armor.legs ${kit.armor.leggings} 1`);
        if (kit.armor.boots) player.runCommandAsync(`replaceitem entity "${player.name}" slot.armor.feet ${kit.armor.boots} 1`);
      } catch (e) {}
    }
    return true;
  } catch (e) {
    utilities.error("applyKitToPlayer failed: " + e);
    return false;
  }
}
