// clanwars.js
import { ActionFormData } from "@minecraft/server-ui";
import * as utilities from "./utilities.js";

export function init() { utilities.log("clanwars: initialized"); }

export function showClanWarMenu(player) {
  const form = new ActionFormData().title("§cClan Wars").body("Clan war options").button("Challenge Clan").button("My Clan Wars");
  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    if (res.selection === 0) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7Clan war challenge flow is available as a skeleton in this build."}]}`);
    } else {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7No clan wars active."}]}`);
    }
  });
}
