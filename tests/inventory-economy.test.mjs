import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};
game.ensureStateShape();

game.state.gold = 1000;
game.state.materials = { iron: 0, essence: 0, crystal: 0 };
game.player.inventory = [];

// --- Kauf eines Ausrüstungsgegenstands beim Händler ---
const equipmentStock = game.state.merchant.stock.find(item => item.slot);
assert.ok(equipmentStock, "Händlerbestand muss mindestens einen Ausrüstungsgegenstand enthalten");
const equipmentIndex = game.state.merchant.stock.indexOf(equipmentStock);

const goldBeforeBuy = game.state.gold;
game.buyMerchantItem(equipmentIndex);
assert.equal(game.player.inventory.length, 1, "Gekaufter Ausrüstungsgegenstand landet im Inventar");
assert.equal(game.state.gold, goldBeforeBuy - equipmentStock.value);
assert.equal(game.player.inventory[0].name, equipmentStock.name);

// --- Kauf eines Silberschlüssels landet nicht im Inventar ---
const keyStock = game.state.merchant.stock.find(item => item.type === "merchant-key");
assert.ok(keyStock, "Händlerbestand muss einen Silberschlüssel enthalten");
const keyIndex = game.state.merchant.stock.indexOf(keyStock);

const inventoryLengthBeforeKey = game.player.inventory.length;
const silverKeysBefore = game.state.silverKeys;
game.buyMerchantItem(keyIndex);
assert.equal(game.state.silverKeys, silverKeysBefore + 1);
assert.equal(game.player.inventory.length, inventoryLengthBeforeKey, "Silberschlüssel darf nicht im Inventar landen");

// --- Kauf ohne ausreichend Gold schlägt fehl, Zustand bleibt unverändert ---
game.state.gold = 0;
const inventoryLengthBeforeFailedBuy = game.player.inventory.length;
game.buyMerchantItem(equipmentIndex);
assert.equal(game.state.gold, 0);
assert.equal(game.player.inventory.length, inventoryLengthBeforeFailedBuy);
assert.equal(game.state.message, "Nicht genug Gold.");

// --- Verkauf eines Inventargegenstands ---
game.state.gold = 100;
const itemToSell = game.player.inventory[0];
game.selectedItemUid = game.ensureInventoryItemUid(itemToSell);
const inventoryLengthBeforeSell = game.player.inventory.length;
game.sellSelected();
assert.equal(game.player.inventory.length, inventoryLengthBeforeSell - 1);
assert.equal(game.state.gold, 100 + (itemToSell.value || 5));
assert.equal(game.selectedItemUid, null, "Auswahl muss nach dem Verkauf geleert werden");

// --- Zerlegen eines Ausrüstungsgegenstands liefert Materialien ---
const dismantleTarget = structuredClone(equipmentStock);
dismantleTarget.uid = game.createInventoryItemUid();
dismantleTarget.itemLevel = 3;
dismantleTarget.rarity = "rare";
game.player.inventory.push(dismantleTarget);
const ironBefore = game.state.materials.iron;
const essenceBefore = game.state.materials.essence;
const inventoryLengthBeforeDismantle = game.player.inventory.length;

game.dismantleItem(game.player.inventory.indexOf(dismantleTarget));

assert.equal(game.player.inventory.length, inventoryLengthBeforeDismantle - 1);
assert.ok(game.state.materials.iron > ironBefore, "Zerlegen muss Eisen liefern");
assert.equal(game.state.materials.essence, essenceBefore + 1, "Seltener Gegenstand liefert zusätzlich Essenz");

console.log(
  "Inventar-Wirtschaft-Test erfolgreich: Kauf, Verkauf und Zerlegen verändern Inventar, Gold und Materialien korrekt."
);
