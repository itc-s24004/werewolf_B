export const defaultGameConfigJson = {
  "defaultMap": {
    name: "城下町",
    description: "",
    map: {
      id: "",
      spawn: {x:-70.5, y:39, z:-0.5},
      rotation: {x:0, y:90},
      sign: {
        switch: {x:-71,y:39,z:-1},
        player: [
          {x:-75, y:39, z:-1},
          {x:-74, y:39, z:-4},
          {x:-71, y:39, z:-5},
          {x:-68, y:39, z:-4},
          {x:-67, y:39, z:-1},
          {x:-68, y:39, z:2},
          {x:-71, y:39, z:3},
          {x:-74, y:39, z:2}
        ]
      }
    },
    ghost: {
      status: {},
      locations: []
    },
    items: {
      trident: {typeId: "minecraft:trident", amount: 1, durability:1, enchant:{type:"loyalty",level:1}, nameTag: "怨念の槍", price: 4, lore: ["2度目の攻撃で必ず倒すことができる","当たるたびに騎士の祈りを無効化する"], name: "怨念の槍", icon: "textures/items/trident"},
    },
    shop: {
      data: {
        common: [
          {typeId: "feather:cooked_beef", amount: 3, durability:0, nameTag: "", price: 1, lore: ["食べると体力を回復する"], name: "ステーキ", icon: "textures/items/beef_cooked"},
          {typeId: "minecraft:bow", amount: 1, durability:0, nameTag: "", price: 2, lore: ["一撃必殺の弓", "一度使うと壊れる"], name: "弓", icon: "textures/items/bow_standby"},
          {typeId: "minecraft:arrow", amount: 1, durability:0, nameTag: "", price: 2, lore: ["一度使うと回収できない"], name: "矢", icon: "textures/items/arrow"},
          {typeId: "minecraft:snowball", amount: 1, durability:0, nameTag: "スタングレネード", price: 2, lore: ["当たったらスタンするグレネード"], name: "スタングレネード", icon: "textures/items/snowball"},
          {typeId: "minecraft:trident", amount: 1, durability:1, enchant:{type:"loyalty",level:1}, nameTag: "怨念の槍", price: 4, lore: ["2度目の攻撃で必ず倒すことができる","当たるたびに騎士の祈りを無効化する"], name: "怨念の槍", icon: "textures/items/trident"},
          {typeId: "feather:invisible_potion", amount: 1, durability:0, nameTag: "", price: 6, lore: ["しばらくの間透明化する"], name: "透明化のポーション", icon: "textures/items/potion_bottle_invisibility"},
          {typeId: "feather:divination", amount: 1, durability:0, nameTag: "", price: 6, lore: ["指定した人を占うことができる", "夜の間のみ使用可能"], name: "占い師の心", icon: "textures/items/heartofthesea_closed"},
          {typeId: "feather:knight_protection", amount: 1, durability:0, nameTag: "", price: 4, lore: ["使用したプレイヤーを次の朝まで守ることができる", "夜の間のみ使用可能"], name: "騎士の祈り", icon: "textures/items/gold_horse_armor"},
          {typeId: "feather:mediumship", amount: 1, durability:0, nameTag: "", price: 4, lore: ["死亡したプレイヤーを確認できる"], name: "霊媒師の遺灰", icon: "textures/items/gunpowder"},
          {typeId: "feather:revelation", amount: 1, durability:0, nameTag: "", price: 1, lore: ["使用してから夜が終わるまでの間占われたことがわかる"], name: "天啓の呪符", icon: "textures/items/paper"},
          {typeId: "feather:vampire_killer", amount: 1, durability:0, nameTag: "", price: 4, lore: ["使用したプレイヤーが吸血鬼ならば一撃で倒すことができる"], name: "聖なる十字架", icon: "textures/items/nether_star"},
          {typeId: "feather:grim_geaper_s_gey", amount: 1, durability:0, nameTag: "", price: 6, lore: ["死神の呪いをかける","呪われたプレイヤーは3度目の朝を迎えると死ぬ"], name: "死神の鍵", icon: "textures/items/ominous_trial_key"}
        ],
        werewolf: [
          {typeId: "feather:werewolves_axe", amount: 1, durability:0, nameTag:"", price: 4, lore: ["この斧で攻撃されたプレイヤーは一撃で倒せる", "使用すると周囲に音が鳴り響き壊れる"], name: "人狼の斧", icon: "textures/items/stone_axe"}
        ],
        madman: [
          {typeId: "feather:madmans_eye", amount: 1, durability:0, nameTag:"", price: 3, lore: ["人狼が誰かランダムでわかる"], name: "共犯の目", icon: "textures/items/ender_eye"}
        ]

      },
      locations: []
    }
  }
}