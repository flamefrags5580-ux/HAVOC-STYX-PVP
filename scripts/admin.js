// admin.js
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import * as permissions from "./permissions.js";
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";
import { world } from "@minecraft/server";

export function init() {
  try {
    world.events.beforeChat.subscribe(ev => {
      const msg = ev.message;
      const sender = ev.sender;
      if (!msg.startsWith("/havocadmin")) return;
      ev.cancel = true;
      const parts = msg.split(" ");
      if (!sender || !sender.hasTag) {
        sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§cCommand only usable in-game by a player."}]}`);
        return;
      }
      if (!sender.hasTag("operator")) {
        sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§cYou must be a server operator to run this command."}]}`);
        return;
      }
      const sub = parts[1];
      const name = parts[2];
      if (!sub || !name) {
        sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§cUsage: /havocadmin add|remove <playerName>"}]}`);
        return;
      }
      const target = [...world.getPlayers()].find(p => p.name.toLowerCase() === name.toLowerCase());
      if (!target) {
        sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§cPlayer not found."}]}`);
        return;
      }
      const uuid = target.xuid || target.id || target.name;
      if (sub === "add") { storage.addAdmin(uuid); sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§aAdded ${target.name} as admin."}]}`); }
      else if (sub === "remove") { storage.removeAdmin(uuid); sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§aRemoved ${target.name} from admins."}]}`); }
      else sender.runCommandAsync(`tellraw "${sender.name}" {"rawtext":[{"text":"§cUnknown subcommand."}]}`);
    });
  } catch (e) {
    utilities.error("admin chat command registration failed: " + e);
  }
}

export function showAdminMenu(player) {
  if (!permissions.isAdmin(player)) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cYou are not an admin."}]}`);
    return;
  }

  const form = new ActionFormData().title("§cAdmin Tools").body("Select an admin action").button("Arena Management").button("Kit Editor").button("Map Reset").button("View Online Players");
  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    switch (res.selection) {
      case 0:
        const createArena = new ModalFormData().title("Create Arena").textField("Arena name", "").textField("Modes (comma separated)", "");
        createArena.show(player).then(ans => {
          if (!ans || ans.isCanceled) return;
          const name = ans.formValues[0];
          const modes = ans.formValues[1].split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
          const list = storage.getArenas();
          list.push({ name, modes, enabled: true, spawns: [], teamSpawns: [] });
          storage.setArenas(list);
          player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§aArena created: ${name}"}]}`);
        });
        break;
      case 1:
        player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"Kit editor: use data/kits.json for config."}]}`);
        break;
      case 2:
        player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"Map reset: use snapshot/reset functions via server console."}]}`);
        break;
      case 3:
        const online = [...world.getPlayers()].map(p => p.name).join(", ");
        player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"Online: ${online}"}]}`);
        break;
    }
  });
}
