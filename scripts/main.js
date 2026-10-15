// scripts/main.js - entrypoint
import { world, system } from "@minecraft/server";

import * as storage from "./storage.js";
import * as permissions from "./permissions.js";
import * as compass from "./compass.js";
import * as kits from "./kits.js";
import * as arenas from "./arenas.js";
import * as duels from "./duels.js";
import * as ffa from "./ffa.js";
import * as clans from "./clans.js";
import * as clanwars from "./clanwars.js";
import * as admin from "./admin.js";
import * as mapreset from "./mapreset.js";
import * as stats from "./stats.js";
import * as utilities from "./utilities.js";

function init() {
  try {
    storage.init();
    permissions.init();
    kits.init();
    arenas.init();
    clans.init();
    clanwars.init();
    mapreset.init();
    stats.init();
    duels.init();
    ffa.init();
    compass.init();
    admin.init();
    utilities.log("HAVOC STYX: Initialized");
  } catch (e) {
    utilities.error("HAVOC STYX: Initialization failed: " + e);
  }
}

system.run(() => {
  init();
});
