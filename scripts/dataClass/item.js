import { ItemStack, EnchantmentType } from "@minecraft/server";


/**
 * 
 * @param {string} type 
 * @param {number} level 
 * @returns {Enchantment}
 */
export function createEnchant(type, level) {
  return {type: new EnchantmentType(type), level:level};
};





export class createItem {
  #Item
  /**
   * 
   * @param {string} typeId 
   * @param {number} amount 
   */
  constructor(typeId, amount) {
    this.#Item = new ItemStack(typeId, amount);
  };
  get Item() {
    return this.#Item;
  };
  /**
   * @param {{type:string, level:number}} enchantObj 
   */
  addEnchant(enchantObj) {
    if (!enchantObj) return this;
    const {type, level} = enchantObj;
    if (this.#Item && this.#Item.hasComponent("minecraft:enchantable")) {
      const enchant_c = this.#Item.getComponent("minecraft:enchantable");
      const maxLevel = new EnchantmentType(type).maxLevel;
      const enchant = createEnchant(type, Math.min(level, maxLevel));
      if (enchant_c.canAddEnchantment(enchant)) {
        enchant_c.addEnchantment(enchant);
      };
    };
    return this;
  };
  /**
   * 
   * @param {string} name 
   */
  setNameTag(name) {
    this.#Item.nameTag = name;
    return this;
  };
  /**
   * 
   * @param {[string]} lore 
   */
  setLore(lore) {
    const item = this.#Item
    if (item) {
      item.setLore(lore);
    };
    return this
  };
  /**
   * 
   * @param {number} durability 
   */
  setDurability(durability) {
    const item = this.#Item;
    if (item && item.hasComponent("durability")) {
      const durability_c = item.getComponent("durability");
      durability_c.damage = durability_c.maxDurability - durability;
    };
    return this
  };
};