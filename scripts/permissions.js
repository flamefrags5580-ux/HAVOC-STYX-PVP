// permissions.js
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";

export function init() {
  utilities.log("permissions: initialized");
}

export function isAdmin(player) {
  try {
    if (!player) return false;
    const admins = storage.getAdmins();
    const xuid = player?.xuid || player?.id || player?.name;
    if (admins.includes(xuid)) return true;
    try {
      if (typeof player.hasTag === "function" && player.hasTag("operator")) return true;
    } catch (e) {}
    return false;
  } catch (e) {
    utilities.error("isAdmin failed: " + e);
    return false;
  }
}
