// stats.js
import * as utilities from "./utilities.js";
import { world } from "@minecraft/server";

const playerStats = new Map();

export function init() {
  world.events.playerDeath.subscribe(ev => {
    try {
      const victim = ev.player || ev.entity;
      const victimName = victim?.name;
      const killer = ev.damageSource?.damagingEntity;
      const killerName = killer?.name;
      if (killerName) {
        ensureStats(killerName);
        const s = playerStats.get(killerName);
        s.kills++;
        s.streak++;
      }
      if (victimName) {
        ensureStats(victimName);
        const sv = playerStats.get(victimName);
        sv.deaths++;
        sv.streak = 0;
      }
    } catch (e) {}
  });
  utilities.log("stats: initialized");
}

function ensureStats(name) {
  if (!playerStats.has(name)) playerStats.set(name, { kills: 0, deaths: 0, streak: 0 });
}
