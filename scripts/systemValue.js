export const systemValue = Object.freeze({
  game: {
    status: {
      standby: "standby",
      play: "play",
      end: "end"
    },
    time: {
      "noon": {
        id: "noon",
        display: `昼`
      },
      "night": {
        id: "night",
        display: `夜`
      }
    },
  },

  job: {
    werewolf: {
      id: "werewolf",
      displayId: "人狼",
      color: "§4"
    },
    madman: {
      id: "madman",
      displayId: "共犯者",
      color: "§1"
    },
    vampire: {
      id: "vampire",
      displayId: "吸血鬼",
      color: "§5"
    },
    villager: {
      id: "villager",
      displayId: "村人",
      color: "§2"
    },
    timeTraveler: {
      id: "timeTraveler",
      displayId: "タイムトラベラー",
      color: "§d"
    }
  },
  
  /**ダメージの種類 */
  damageType: {
    /**素手 */
    default: {
      id: "default",
      deathText: "に殺された",
      damage: 1
    },
    /**弓矢 */
    arrow: {
      id: "arrow",
      deathText: "に射抜かれた",
      damage: 999
    },
    /**聖なる十字架 */
    vampire_killer: {
      id: "vampire_killer",
      deathText: "に浄化された",
      damage: 1
    },
    /**人狼の斧 */
    werewolves_axe: {
      id: "werewolves_axe",
      deathText: "に食べられた",//によって悲惨な最期を迎えた
      damage: 999
    },
    /**呪い */
    curse: {
      id: "curse",
      deathText: "に呪われた",
      damage: 1
    },
    /**怨念の槍 */
    grudge: {
      id: "grudge",
      deathText: "に呪われた",
      damage: 40
    },

    /**その他 */
    others: {
      id: "others",
      deathText: "に殺された",
      damage: 1
    }
  }
})
