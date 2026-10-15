// storage.js
import { world } from "@minecraft/server";
import * as utilities from "./utilities.js";

const STORE_KEY = "havoc_styx_storage_v1";
let _data = {
  admins: [],
  arenas: [],
  kits: [],
  clans: [],
  matches: []
};

export function init() {
  try {
    const raw = world.getDynamicProperty(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") _data = { ..._data, ...parsed };
    }
  } catch (e) {
    utilities.error("storage.init: failed to load storage: " + e);
  }

  _data.admins = _data.admins || [];
  _data.arenas = _data.arenas || [];
  _data.kits = _data.kits || [];
  _data.clans = _data.clans || [];
  _data.matches = _data.matches || [];
}

export function save() {
  try {
    world.setDynamicProperty(STORE_KEY, JSON.stringify(_data));
  } catch (e) {
    utilities.error("storage.save: failed: " + e);
  }
}

export function getAdmins() { return _data.admins; }
export function addAdmin(uuid) { if (!_data.admins.includes(uuid)) { _data.admins.push(uuid); save(); } }
export function removeAdmin(uuid) { const idx = _data.admins.indexOf(uuid); if (idx !== -1) { _data.admins.splice(idx, 1); save(); } }
export function getArenas() { return _data.arenas; }
export function setArenas(arr) { _data.arenas = arr; save(); }
export function getKits() { return _data.kits; }
export function setKits(arr) { _data.kits = arr; save(); }
export function getClans() { return _data.clans; }
export function setClans(arr) { _data.clans = arr; save(); }
export function getMatches() { return _data.matches; }
export function setMatches(arr) { _data.matches = arr; save(); }
