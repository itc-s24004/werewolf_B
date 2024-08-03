import { discord } from "./featherModules/http";
import { InventoryManager } from "./featherModules/InventoryManager";
import { gameSystem } from "./system";
import { systemValue } from "./systemValue";

import { GameMode, Player, world } from "@minecraft/server";



export class gamePlayer {
  #discordID = undefined;

  #player;
  #Inventory
  #health = 100;//体力
  #maxHealth = 100;//最大体力
  #divination = 0;//占い回数
  #job = systemValue.job.werewolf.id;//役職
  #invincible = false;//無敵
  #knightProtection = 0;//騎士の祈り
  #revelation = false;//天啓の呪符
  #grudge = 0;//怨念の槍
  #grim_geaper = -1//死神の鍵
  #alive = true;//生存
  #gameLog = []
  #stun = 0;
  #name
  /**
   * @param {Player} player
   */
  constructor(player, jobId) {
    this.#player = player;
    this.#Inventory = new InventoryManager(player);
    this.#job = jobId;
    player.getComponent("health").resetToMaxValue()
    this.#name = player.name

    
    discord.request("account", player.name).then(res => {//discordアカウント取得
      if (res) {
        player.sendMessage("discordアカウントの取得に成功しました");
        this.#discordID = res.body;
      } else {
        player.sendMessage("discordアカウントの取得に失敗しました");
      };
    });
  };
  get discordID() {
    return this.#discordID;
  };
  get player() {
    return this.#player;
  };
  get name() {
    return this.#name
  }
  get revelation() {
    return this.#revelation;
  };
  get Inventory() {
    return this.#Inventory;
  };
  addGameLog(logText) {
    this.#gameLog.push(logText);
  };
  get gameLog() {
    return this.#gameLog.join("\n§r");
  };
  sendMessage(text) {
    if (this.#player.isValid()) {
      this.#player.sendMessage(text);
    };
  };
  leave() {
    this.setKnightProtection(0);
    this.#health = 0;
    this.#alive = false;
    const deathText = `§4${this.#name} は自殺した`
    gameSystem.addGameLog(deathText)
    gameSystem.sendGameMessage(deathText, true);
    gameSystem.checkGameEnd();
    
  };

  get isAlive() {
    return this.#alive;
  }
  setJob(jobId) {
    if (jobId in systemValue.job) {
      this.#job = jobId;
    };
  };
  get job() {
    return this.#job;
  };
  /**
   * 占い結果を取得します
   * @returns {string}
   */
  divination() {
    if (this.#job == systemValue.job.madman.id || this.#job == systemValue.job.timeTraveler.id) {
      return systemValue.job.villager.id;

    } else {
      return this.#job;

    };
  };

  /**
   * プレイヤーにダメージを与え、死亡した場合 true を返します
   * @param {*} damageType 
   * @param {string} timeID
   * @returns {boolean}
   */
  applyDamage(damageType, timeID, deathText) {
    if (this.#job == systemValue.job.vampire.id && timeID == systemValue.game.time.night.id) {//吸血鬼かつ夜
      if (damageType == systemValue.damageType.vampire_killer.id) {
        this.#health = 0;
        this.#player.dimension.playSound("mob.zombie.remedy", this.#player.location);
      } else if (damageType == systemValue.damageType.werewolves_axe.id) {
        this.#player.dimension.playSound("werewolves_axe.attack", this.#player.location);
      };
    } else if (this.#job == systemValue.job.vampire.id && damageType == systemValue.damageType.vampire_killer.id) {//聖なる十字架
      this.#health = 0;
      this.#player.dimension.playSound("mob.zombie.remedy", this.#player.location);

    } else if (damageType == systemValue.damageType.arrow.id) {//弓矢
      this.#health = 0;

    } else if (damageType == systemValue.damageType.werewolves_axe.id) {//人狼の斧
      this.#health = 0;
      this.#player.dimension.playSound("werewolves_axe.attack", this.#player.location);

    } else if (damageType == systemValue.damageType.grudge.id) {//怨念の槍
      this.setKnightProtection(0);
      this.#health -= 40;
      this.#grudge ++;
      if (this.#grudge >= 2) {
        this.#health = 0;
        this.#player.dimension.playSound("item.trident.thunder", this.#player.location, {volume:1});
      } else {
        this.#player.dimension.playSound("mob.elderguardian.curse", this.#player.location, {volume:1});
      }

    } else if (damageType == systemValue.damageType.default.id) {//素手
      this.#health -= 5;
      
    } else if (damageType == systemValue.damageType.curse.id) {//呪い(ゴースト)
      this.#health -= 3;
    
    };
    if (this.#health <= 0) {
      if (this.#knightProtection >= 1) {
        this.#health = this.#maxHealth;
        this.#knightProtection --;
        this.addGameLog("騎士の加護によって守られた");
        this.#player.dimension.playSound("random.anvil_land", this.#player.location);
        gameSystem.addGameLog(`§e${this.#player.name} は騎士の加護によって守られた`)

      } else {
        this.#alive = false;
        this.addGameLog("死亡した");
        this.#player.setGameMode(GameMode.spectator);
        gameSystem.addGameLog(deathText)
        gameSystem.sendGameMessage(deathText, true);
        if (this.#job == systemValue.job.timeTraveler.id) {
          gameSystem.addGameLog(`§e${this.#name}は未来を変えることができなかった`);
        };
        gameSystem.checkGameEnd();
        
      }
    };
    const health_C = this.#player.getComponent("health");
    health_C.setCurrentValue(Math.max(Math.floor(health_C.effectiveMax * this.#health / this.#maxHealth), 1));
    return !this.#alive;
  };

  addKnightProtection() {
    if (this.#job == systemValue.job.villager.id || this.#job == systemValue.job.madman.id) {
      this.#knightProtection ++;
    };
  };
  resetKnightProtection() {
    this.#knightProtection = 0;
  };
  /**
   * 
   * @param {number} status 
   */
  setKnightProtection(status) {
    this.#knightProtection = status;
  };
  /**
   * 
   * @param {boolean} status 
   */
  setRevelation(status) {
    this.#revelation = status;
  };
  /**
   * 死神の呪い
   */
  grim_geaper_curse() {
    if (!this.#alive) return
    if (this.#grim_geaper <= -1) {
      this.#grim_geaper = 2;
      this.sendMessage("死神に狙われた")
      this.#player.playSound("mob.elderguardian.curse", {location:this.#player.location, volume:1});
    };
  };
  /**
   * 死神の呪い解呪
   */
  clear_grim_geaper_curse() {
    this.#grim_geaper = -1;
  };
  get grim_geaper() {
    return this.#grim_geaper;
  };
  noon() {
    this.#knightProtection = 0;
    this.#revelation = false;
    if (this.#grim_geaper >= 1) {
      this.#grim_geaper --;
    };
    if (this.#grim_geaper == 0) {
      this.#health = 0;
      this.#alive = false;
      this.#player.setGameMode(GameMode.spectator);
      const deathText = `§4${this.#name} は死神に命を奪われた`;
      gameSystem.addGameLog(deathText);
      gameSystem.sendGameMessage(deathText, false);
      gameSystem.checkGameEnd();
    } else if (this.#grim_geaper >= 1) {
      this.sendMessage(`§4死神が来るまであと${this.#grim_geaper}日`);
    };
  };

  kill() {
    this.#health = 0;
    this.#alive = false;
    this.#player.setGameMode(GameMode.spectator);
    const deathText = `§4${this.#name} は死亡した`;
    gameSystem.addGameLog(deathText);
    gameSystem.sendGameMessage(deathText, true);
  }

  /**
   * 
   * @param {number} value 
   */
  heal(value) {
    this.#health = Math.min(this.#health + Math.abs(value), this.#maxHealth);
    if (this.#health == this.#maxHealth) {
      this.#player.addEffect("speed", 10*20, {amplifier: 3, showParticles: false});
    };
    const health_C = this.#player.getComponent("health");
    health_C.setCurrentValue(Math.max(Math.floor(health_C.effectiveMax * this.#health / this.#maxHealth), 1));
  };

  setStun(time) {
    this.#stun = time;
  };

  get stun() {
    return this.#stun;
  };
}