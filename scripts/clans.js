// clans.js
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import * as storage from "./storage.js";
import * as utilities from "./utilities.js";

export function init() {
  const c = storage.getClans();
  if (!c) storage.setClans([]);
  utilities.log("clans: initialized");
}

export function showClanMenu(player) {
  const form = new ActionFormData().title("§cClans").body("Clan options").button("Create Clan").button("View My Clan").button("Leave Clan");
  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    switch (res.selection) {
      case 0: showCreateClan(player); break;
      case 1: showMyClan(player); break;
      case 2: leaveClan(player); break;
    }
  });
}

function showCreateClan(player) {
  const form = new ModalFormData().title("Create Clan").textField("Clan name", "").textField("Tag", "");
  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    const [name, tag] = res.formValues;
    if (!name || !tag) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cName and tag required."}]}`);
      return;
    }

    const clans = storage.getClans();
    if (clans.find(c => c.name.toLowerCase() === name.toLowerCase() || c.tag.toLowerCase() === tag.toLowerCase())) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cClan name or tag already exists."}]}`);
      return;
    }

    const clan = { id: Date.now().toString(), name, tag, leader: player.name, officers: [], members: [player.name], stats: { kills: 0, wins: 0 } };
    clans.push(clan);
    storage.setClans(clans);
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§aClan created."}]}`);
  });
}

function showMyClan(player) {
  const clan = storage.getClans().find(c => c.members.includes(player.name));
  if (!clan) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7You are not in a clan."}]}`);
    return;
  }
  const body = `Clan: ${clan.name} [${clan.tag}]\nLeader: ${clan.leader}\nMembers: ${clan.members.join(", ")}\nKills: ${clan.stats.kills} Wins: ${clan.stats.wins}`;
  player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"${body}"}]}`);
}

function leaveClan(player) {
  let clans = storage.getClans();
  const clan = clans.find(c => c.members.includes(player.name));
  if (!clan) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7You are not in a clan."}]}`);
    return;
  }
  if (clan.leader === player.name) {
    clans = clans.filter(c => c.id !== clan.id);
    storage.setClans(clans);
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cYou were leader. Clan disbanded."}]}`);
    return;
  }
  clan.members = clan.members.filter(m => m !== player.name);
  storage.setClans(clans);
  player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§aYou left the clan."}]}`);
}
