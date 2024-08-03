import { ActionFormData } from "@minecraft/server-ui";
import { defaultGameConfigJson } from "./data/gameConfigJson";
import { gamePlayer } from "./gamePlayer";
import { createItem } from "./dataClass/item";

export const shopLoader =  new class shopLoader {
  #shopData = defaultGameConfigJson.defaultMap.shop.data
  constructor(shopData = defaultGameConfigJson.defaultMap.shop.data) {
    this.#shopData = shopData
  }
  setShopData(shopData = defaultGameConfigJson.defaultMap.shop.data) {
    this.#shopData = shopData
  }
  /**
   * 
   * @param {gamePlayer} gamePlayer 
   */
  showForm(gamePlayer, message = "") {
    const player = gamePlayer.player;
    const IM = gamePlayer.Inventory;
    const container = IM.container;

    const job = gamePlayer.job;
    const emerald = IM.getItemAmount("minecraft:emerald");
    const common = this.#shopData.common;
    const jobShop = job in this.#shopData ? this.#shopData[job] : []
    const shopData = common.concat(jobShop);
    
    const form = new ActionFormData();
    form.title(`§2エメラルド§rを§6${emerald}§r個所持しています`);
    form.body(message);
    form.button("閉じる");
    const items = [];
    common.forEach(shopItem => {
      const {typeId, amount, durability, enchant, nameTag, price, lore, name, icon} = shopItem
      form.button(`${name} x ${amount}\n§r${emerald >= price ? "§2" : "§4"}エメラルド x ${price}`, icon);
      const item = new createItem(typeId, amount).setDurability(durability).setLore(lore).setNameTag(nameTag);
      item.addEnchant(enchant);
      items.push(item.Item);
    });
    jobShop.forEach(shopItem => {
      const {typeId, amount, durability, enchant, nameTag, price, lore, name, icon} = shopItem
      form.button(`${emerald >= price ? "§d" : ""}${name} x ${amount}\n§r${emerald >= price ? "§2" : "§4"}エメラルド x ${price}`, icon);
      const item = new createItem(typeId, amount).setDurability(durability).setLore(lore).setNameTag(nameTag);
      item.addEnchant(enchant);
      items.push(item.Item);
    });
    if (container.emptySlotsCount >= 1) {
      form.show(gamePlayer.player).then(res => {
        if (!res.canceled && res.selection != 0 && res.selection <= items.length) {
          const select = res.selection - 1;
          const shopItem = shopData[select]
          if (shopItem.price <= emerald) {
            IM.removeItem("minecraft:emerald", shopItem.price);
            container.addItem(items[select]);
            this.showForm(gamePlayer, `${shopItem.name} + ${shopItem.amount} => §f${IM.getItemAmount(shopItem.typeId)} 個所持`);
          } else {
            this.showForm(gamePlayer, "");
          }
        }
        
      })
    } else {
      player.sendMessage("手持ちに空きスロットがありません");
    }

  }
}