import { EquipmentSlot, ItemStack, Player, world } from "@minecraft/server"

export class InventoryManager {
  #container
  #equippable
  /**
   * 
   * @param {Player} player 
   */
  constructor(player) {
    this.#container = player.getComponent("inventory").container;
    this.#equippable = player.getComponent("equippable")
  }
  get container() {
    return this.#container;
  };
  get equippable() {
    return this.#equippable;
  };
  /**
   * 指定した id のアイテム数を取得します
   * @param {string} typeId 
   */
  getItemAmount(typeId) {
    let itemCount = 0
    for (let slot = 0; slot < this.#container.size; slot++) {
      const item = this.#container.getItem(slot);
      itemCount += item && item.typeId == typeId ? item.amount : 0;
    };
    return itemCount;
  };
  /**
   * 指定した id のアイテムを指定した数削除します
   * @param {string} typeId 
   * @param {number} amount 
   * @returns {number}
   * 足りない数を返します
   */
  removeItem(typeId, amount) {
    const container = this.#container;
    let i = 0
    while (amount > 0 && i < container.size) {
      const item = container.getItem(i);
      i++;
      if (item && item.typeId == typeId) {
        if (item.amount > amount) {
          item.amount -= amount;
          container.setItem(i-1, item);
          break;
        } else {
          amount -= item.amount;
          container.setItem(i-1, undefined);
        };
      };
    };
    return amount;
  };
  /**
   * 
   * @param {EquipmentSlot} slot 
   */
  getEquipment(slot) {
    return this.#equippable.getEquipment(slot);
  };
  /**
   * 
   * @param {EquipmentSlot} slot 
   * @param {ItemStack} item 
   */
  setEquipment(slot, item) {
    return this.#equippable.setEquipment(slot, item);
  };
};