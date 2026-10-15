// duels.js
import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import * as utilities from "./utilities.js";
import * as arenas from "./arenas.js";
import * as kits from "./kits.js";
import * as storage from "./storage.js";

const REQUEST_TIMEOUT = 60;
const activeDuels = new Map();
const outgoingRequests = new Map();

export function init() {
  utilities.log("duels: initialized");
}

function validatePlayerEligible(player) {
  for (const [, duel] of activeDuels) {
    if (duel.players.includes(player.name)) return false;
  }
  return true;
}

export function showChallengeMenu(player) {
  const form = new ActionFormData()
    .title("§cDuel — Challenge")
    .body("Select a target")
    .button("Target player")
    .button("Close");

  form.show(player).then(res => {
    if (!res || res.isCanceled || res.selection === 1) return;
    const targetName = promptTarget(player);
    if (!targetName) return;
    const target = [...world.getPlayers()].find(p => p.name.toLowerCase() === targetName.toLowerCase());
    if (!target) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cTarget player not found or offline."}]}`);
      return;
    }
    if (target.name === player.name) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cYou cannot challenge yourself."}]}`);
      return;
    }
    if (!validatePlayerEligible(player) || !validatePlayerEligible(target)) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cEither you or the target is already in a match."}]}`);
      return;
    }

    const kitsList = storage.getKits() || [];
    const kit = kitsList[0] || null;
    const arena = (storage.getArenas() || [])[0] || null;
    sendDuelRequest(player, target, kit, arena);
  });
}

function promptTarget(player) {
  // Simple best-effort prompt; this is a UI skeleton and can be replaced by a modal if desired
  const targetName = "";
  player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7Use the command /duel <playername> or type the player name in your server console."}]}`);
  return targetName;
}

function sendDuelRequest(challenger, target, kit, arena) {
  const key = `${challenger.name}->${target.name}`;
  if (outgoingRequests.has(key)) {
    challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§cYou already have a pending request to that player."}]}`);
    return;
  }

  const request = { challenger: challenger.name, target: target.name, kit: (kit && kit.name) || "Default", arena: (arena && arena.name) || "Default", ts: utilities.nowSeconds() };
  outgoingRequests.set(key, request);

  const form = new ActionFormData()
    .title("§cDuel Request")
    .body(`Player §c${challenger.name} §7wants to duel\nKit: ${request.kit}\nArena: ${request.arena}`)
    .button("✅ Accept")
    .button("❌ Decline");

  form.show(target).then(res => {
    outgoingRequests.delete(key);
    if (!res || res.isCanceled) {
      challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§cDuel request to ${target.name} was ignored."}]}`);
      return;
    }
    if (res.selection === 0) {
      challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§a${target.name} accepted your duel!"}]}`);
      startDuel(challenger, target, kit, arena);
    } else {
      challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§c${target.name} declined your duel request."}]}`);
    }
  }).catch(e => {
    outgoingRequests.delete(key);
    utilities.error("sendDuelRequest form error: " + e);
  });

  system.runTimeout(() => {
    if (outgoingRequests.has(key)) {
      outgoingRequests.delete(key);
      challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§cDuel request to ${target.name} expired."}]}`);
    }
  }, REQUEST_TIMEOUT * 20);
}

function startDuel(p1, p2, kit, arena) {
  try {
    const matchId = `duel_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const duel = { id: matchId, players: [p1.name, p2.name], kit: kit ? kit.name : "Default", arena: arena ? arena.name : "Default", startedAt: utilities.nowSeconds() };
    activeDuels.set(matchId, duel);

    const arenaObj = storage.getArenas().find(a => a.name === duel.arena);
    if (arenaObj) {
      arenas.teleportToArenaSpawn(p1, arenaObj, 0, 0);
      arenas.teleportToArenaSpawn(p2, arenaObj, 1, 0);
    }

    if (kit) {
      kits.applyKitToPlayer(p1, kit);
      kits.applyKitToPlayer(p2, kit);
    }

    const onDeath = ev => {
      try {
        const victim = ev.player || ev.entity;
        const name = victim && victim.name;
        if (!name || !duel.players.includes(name)) return;
        const winner = duel.players.find(n => n !== name);
        if (!winner) return;
        const winnerPlayer = [...world.getPlayers()].find(p => p.name === winner);
        if (winnerPlayer) {
          for (const p of world.getPlayers()) {
            p.runCommandAsync(`tellraw "${p.name}" {"rawtext":[{"text":"§c${name} §7was defeated — §a${winnerPlayer.name} §7wins the duel!"}]}`);
          }
        }
        activeDuels.delete(matchId);
        restorePlayerAfterMatch(name);
        restorePlayerAfterMatch(winner);
        try { world.events.playerDeath.unsubscribe(onDeath); } catch (e) {}
      } catch (e) { utilities.error("onDeath error: " + e); }
    };
    world.events.playerDeath.subscribe(onDeath);

    const matches = storage.getMatches();
    matches.push(duel);
    storage.setMatches(matches);
  } catch (e) {
    utilities.error("startDuel failed: " + e);
  }
}

function restorePlayerAfterMatch(playerName) {
  try {
    const player = [...world.getPlayers()].find(p => p.name === playerName);
    if (!player) return;
    try {
      const spawn = world.getDimension("overworld").getSpawnLocation();
      player.teleport(spawn);
    } catch (e) {}
    try { player.runCommandAsync(`effect "${player.name}" clear`); } catch (e) {}
  } catch (e) {}
}

export function showRequestsMenu(player) {
  const list = [];
  for (const [, r] of outgoingRequests.entries()) {
    if (r.target === player.name) list.push(r);
  }
  if (list.length === 0) {
    player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§7No incoming duel requests."}]}`);
    return;
  }
  const form = new ActionFormData().title("Incoming Duel Requests").body("Select request to respond");
  list.forEach(r => form.button(`${r.challenger}\nKit: ${r.kit}\nArena: ${r.arena}`));

  form.show(player).then(res => {
    if (!res || res.isCanceled) return;
    const selected = list[res.selection];
    if (!selected) return;
    const challenger = [...world.getPlayers()].find(p => p.name === selected.challenger);
    if (!challenger) {
      player.runCommandAsync(`tellraw "${player.name}" {"rawtext":[{"text":"§cChallenger is offline or no longer available."}]}`);
      return;
    }

    const acceptForm = new ActionFormData().title("Duel Request").body(`Accept duel from ${selected.challenger}?`).button("Accept").button("Decline");
    acceptForm.show(player).then(r2 => {
      if (!r2 || r2.isCanceled) return;
      if (r2.selection === 0) startDuel(challenger, player, { name: selected.kit }, { name: selected.arena });
      else challenger.runCommandAsync(`tellraw "${challenger.name}" {"rawtext":[{"text":"§c${player.name} declined your duel request."}]}`);
    });
  });
}
