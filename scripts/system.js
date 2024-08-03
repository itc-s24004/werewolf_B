import { DP } from "./featherModules/DynamicProperty"

import { Player, EquipmentSlot, world, EntityHurtAfterEvent, ProjectileHitEntityAfterEvent, Entity, GameMode, EntityHitEntityAfterEvent, ItemCompleteUseAfterEvent, ItemStack, ProjectileHitBlockAfterEvent, PlayerSpawnAfterEvent, ItemUseAfterEvent, PlayerInteractWithBlockBeforeEvent, PlayerLeaveAfterEvent, TimeOfDay } from "@minecraft/server"
import { gamePlayer } from "./gamePlayer"
import { systemValue } from "./systemValue"
import { shopLoader } from "./shopLoader"
import { defaultGameConfigJson } from "./data/gameConfigJson"
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui"
import { discord } from "./featherModules/http"
import { createItem } from "./dataClass/item"
import { character_form_main } from "./character"



const memberViceStatus = {
  mic: {
    "*": {
      status: false
    },
    "target": {
      members: [],
      status: false
    }
  },
  speaker: {
    "*": {
      status: false
    },
    "target": {
      members: [],
      status: false
    }
  }
}

export const gameSystem = new class gameSystem {
  /**
   * プレイヤー情報が格納されています
   * @type {Object.<string, gamePlayer>}
   */
  #players = {}
  /**
   * ゲームステータスが格納されています
   */
  #config = {
    time: {//昼夜の時間(ms)
      noon: 60*1000,
      night: 120*1000
    },
    job: {
      werewolf: 1,
      madman: 1,
      vampire: 0,
      timeTraveler: 0
    },
    timeTraveler: 0.1,//タイムトラベラー発生確率
    escapeDay: 7,
    mapJson: defaultGameConfigJson.defaultMap
  }
  #game = {
    status: systemValue.game.status.standby,
    timeID: systemValue.game.time.noon.id,
    time: 0,
    date: 0,
    switchSign: 0//看板切り替え
  }
  #shop = shopLoader;
  #gameLog = [];
  #spawnGhost() {
    const dimension = world.getDimension("overworld");
    for (let i = 0; i < 256; i++) {
      const x = Math.random()*280-140;
      const z = Math.random()*280-140;
      const block_ = dimension.getBlockFromRay({x:x, y:110, z:z}, {x:0, y:-90, z:0});
      if (block_) {
        const location = block_.block.location;
        location.y += 1;
        const ghost = dimension.spawnEntity("feather:ghost", location);
        ghost.setDynamicProperty("health", 3);
      } else {
        world.sendMessage("noooo")
      }
    };
  };
  #removeGhost() {
    world.getDimension("overworld").getEntities({type:"feather:ghost"}).forEach(ghost => {
      ghost.remove();
    });
  };
  #removeAllItem() {
    world.getAllPlayers().forEach(player => {
      player.getComponent("inventory").container.clearAll();
      Object.values(EquipmentSlot).forEach(slot => {
        player.getComponent("equippable").setEquipment(slot, undefined);
      });
    });
    world.getDimension("overworld").getEntities({type:"minecraft:item"}).forEach(item => {
      item.remove();
    });
  };
  #noonUpdate() {
    this.queryPlayer({isAlive:true}).forEach(gameplayer => {
      gameplayer.noon();
    });
    if (this.#config.escapeDay  != 0 && this.#game.date >= this.#config.escapeDay) {
      this.queryPlayer({isAlive:true}).forEach(gameplayer => {
        if (gameplayer.job != systemValue.job.villager.id) {
          gameplayer.kill();
        }
      });
      this.checkGameEnd();
    };
  };
  #emeraldChance(location) {
    if (Math.random() < 0.5) {
      world.getDimension("overworld").spawnItem(new ItemStack("minecraft:emerald", 1), location);
    };
  };
  #reset() {
    this.#game.time = 0;
    this.#game.date = 1;
    this.#game.timeID = systemValue.game.time.noon.id;
    this.#game.status = systemValue.game.status.standby;

    this.#game.switchSign = 0;

    this.#gameLog = [];

    this.#players = [];
    this.#removeGhost();
    this.#removeAllItem();

    this.voiceUpdate();
  };
  voiceUpdate() {
    if (this.#game.status == systemValue.game.status.play) {

      memberViceStatus.mic["*"].status = this.#game.timeID == systemValue.game.time.night.id;
      memberViceStatus.speaker["*"].status = this.#game.timeID == systemValue.game.time.night.id;
      memberViceStatus.mic["target"].status = this.#game.timeID == systemValue.game.time.noon.id;
      memberViceStatus.speaker["target"].status = this.#game.timeID == systemValue.game.time.noon.id;
      memberViceStatus.mic.target.members = this.queryPlayer({isAlive:true}).map(gameplayer => gameplayer.discordID);
      memberViceStatus.speaker.target.members = this.queryPlayer({isAlive:true}).map(gameplayer => gameplayer.discordID);
      discord.request("voice", memberViceStatus);
      

    } else {
      memberViceStatus.mic["*"].status = true;
      memberViceStatus.speaker["*"].status = true;
      memberViceStatus.mic["target"].status = true;
      memberViceStatus.speaker["target"].status = true;
      memberViceStatus.mic.target.members = [];
      memberViceStatus.speaker.target.members = [];
      discord.request("voice", memberViceStatus);

    }
  }
  setUp() {
    this.voiceUpdate();
    this.#gameLog = []
    this.#game.date = 1
    this.#game.timeID = systemValue.game.time.noon.id;
    this.#game.time = new Date().getTime() + 15*1000;
    this.#game.status = systemValue.game.status.play;
    this.#removeAllItem();
    this.#removeGhost();




    if (Math.random() < this.#config.timeTraveler) {//タイムトラベラー発生
      this.#config.job.timeTraveler = 1;
    };
    Object.keys(this.#players).forEach(playerName => {//プレイヤー一覧削除
      delete this.#players[playerName];
    })
    const allPlayer = world.getAllPlayers();
    //役職テーブル生成
    const jobs = []
    for (let i = 0; i < allPlayer.length; i++) {
      jobs.push(systemValue.job.villager.id);
    };
    Object.keys(this.#config.job).forEach(jobName => {
      if (jobName in systemValue.job) {
        for (let i = 0; i < this.#config.job[jobName]; i++) {
          jobs.push(systemValue.job[jobName].id);
          jobs.shift();
        };
      };
    });
    
    allPlayer.forEach(player => {//役職割り振り
      const job = jobs.splice(Math.floor(Math.random()*jobs.length), 1);
      player.onScreenDisplay.setTitle(`あなたの役職は ${systemValue.job[job].color}${systemValue.job[job].displayId}§f です`);
      player.sendMessage(`あなたの役職は ${systemValue.job[job].color}${systemValue.job[job].displayId}§f です`);
      const GPlayer = new gamePlayer(player, job);
      this.#players[player.name] = GPlayer;
      player.setGameMode(GameMode.adventure);
    });
    const werewolf = this.queryPlayer({jobId:systemValue.job.werewolf.id});
    werewolf.forEach(gameplayer => {
      gameplayer.sendMessage(`仲間 : ${werewolf.map(gp => gp.player.name).join(" , ")}`);
    });

    this.queryPlayer({jobId: systemValue.job.timeTraveler.id}).forEach(gameplayer => {
      gameplayer.sendMessage(`§f人狼は §4${werewolf.map(gp => gp.player.name).join(" §f, §4")} §fです`);
    })



    //看板生成
    world.getDimension("overworld").getEntities({type:"feather:sign_click_box"}).forEach(clickBox => {
      clickBox.remove();
    });
    let signNumber = 0;
    this.#config.mapJson.map.sign.player.forEach(location => {
      const {x, y, z} = location;
      const sign = world.getDimension("overworld").spawnEntity("feather:sign_click_box", {x:x+0.5, y:y, z:z+0.5});
      sign.setDynamicProperty("signNumber", signNumber);
      signNumber++;
    });
    this.updateSign();

  };
  checkGameEnd() {
    const winner = this.getWinner();
    if (winner) {
      this.#game.status = systemValue.game.status.end;
      this.#game.time = new Date().getTime()+10*1000;
      this.#removeGhost();
      this.#removeAllItem();



      this.playSound("challenge_complete");
      this.title(`§e${systemValue.job[winner].displayId} の勝利`);
      this.addGameLog(`§e${systemValue.job[winner].displayId} の勝利`);

      world.setTimeOfDay(TimeOfDay.Noon);

      world.sendMessage("試合ログ==========");
      world.sendMessage(this.#gameLog.join("§r\n"));
      world.sendMessage("役職一覧==========");
      Object.keys(systemValue.job).forEach(jobName => {
        const job = systemValue.job[jobName];
        world.sendMessage(`${job.color}${job.displayId}`);
        world.sendMessage(`${this.queryPlayer({jobId:jobName}).map(gameplayer => gameplayer.name).join(" , ")}`);
      });

    };
    this.voiceUpdate();
  };
  playSound(soudId, volume=0.25) {
    world.getAllPlayers().forEach(player => {
      player.playSound(soudId, {location:player.location, volume:volume});
    });
  };
  title(text, subtext="") {
    world.getAllPlayers().forEach(player => {
      player.onScreenDisplay.setTitle(text, {subtitle:subtext, stayDuration: 2*20, fadeInDuration:0.5*20, fadeOutDuration:0.5*20});
    });
  };
  tickUpdate() {
    const now = new Date().getTime();
    if (this.#game.status == systemValue.game.status.standby) {

    } else if (this.#game.status == systemValue.game.status.play) {
      if (this.#game.time - now <= 0) {
        if (this.#game.timeID == systemValue.game.time.noon.id) {
          this.#game.time = now + this.#config.time.night;
          this.#game.timeID = systemValue.game.time.night.id;
          this.#spawnGhost();

          this.title("夜になりました", `${this.#game.date} 日目`);
          this.voiceUpdate();
  
        } else {
          this.#game.date ++;
          this.#game.time = now + this.#config.time.noon;
          this.#game.timeID = systemValue.game.time.noon.id;
          this.#removeGhost();
          if (this.#config.escapeDay != 0 && this.#config.escapeDay - this.#game.date <= 5 && this.#config.escapeDay != this.#game.date) {
            world.sendMessage(`§eゲーム終了まで ${this.#config.escapeDay - this.#game.date} 日`);
            this.playSound("block.enchanting_table.use", 1);
          };
          this.#noonUpdate();

          this.title("朝になりました", `${this.#game.date} 日目`);
          this.voiceUpdate();

        };
      };
      
      this.autoKill();
      this.queryPlayer({isAlive:true}).forEach(gameplayer => {
        const player = gameplayer.player;
        const input = player.inputPermissions;
        try {
          if (gameplayer.stun >= now) {
            if (input.movementEnabled) input.movementEnabled = false;
          } else {
            if (!input.movementEnabled) input.movementEnabled = true;
          }
        } catch {}
      })
      world.getAllPlayers().forEach(player => {
        if (!(player.name in this.#players) || !this.#players[player.name].isAlive) {
          const input = player.inputPermissions;
          try {
            if (!input.movementEnabled) input.movementEnabled = true;
          } catch {}
        }
      })
      
      if(this.#game.timeID == systemValue.game.time.noon.id) {
        world.setTimeOfDay(13000-13000*(this.#game.time-now)/this.#config.time.noon);

      } else {
        world.setTimeOfDay(23999-10999*(this.#game.time-now)/this.#config.time.night);

      };
      world.getAllPlayers().forEach(player => {
        player.onScreenDisplay.setActionBar(`ターン終了まで ${Math.ceil((this.#game.time - now)/1000)} 秒`);
      });


    } else if (this.#game.status == systemValue.game.status.end) {
      if (this.#game.time - now <= 0) {
        this.#removeAllItem();
        this.#removeGhost();
        world.getAllPlayers().forEach(player => {
          player.setGameMode(GameMode.adventure);
          player.teleport(this.#config.mapJson.map.spawn, {dimension:world.getDimension("overworld"),rotation:this.#config.mapJson.map.rotation});
          player.getComponent("inventory").container.addItem(new ItemStack("feather:menubook"));
        });
        this.#game.status = systemValue.game.status.standby;
      };

    };
    if (this.#game.status != systemValue.game.status.play) {
      world.getAllPlayers().forEach(player => {
        const input = player.inputPermissions;
        try {
          if (!input.movementEnabled) input.movementEnabled = true;
        } catch {}
      })
    }
  };
  get activePlayers() {
    return Object.values(this.#players).filter(gameplayer => {
      return (gameplayer.isAlive && gameplayer.player.isValid());
    });
  };
  autoKill() {
    this.activePlayers.forEach(gameplayer => {
      const player = gameplayer.player;
      const item = gameplayer.Inventory.getEquipment(EquipmentSlot.Mainhand);
      if (item && item.typeId == "feather:werewolves_axe") {
        const targets = player.getEntitiesFromViewDirection({ignoreBlockCollision:false, includeLiquidBlocks:false, includePassableBlocks:false, maxDistance:2.5, type:"minecraft:player"});
        const target = targets.find(player => player.entity.name in this.#players)?.entity;
        if (target && this.#players[target.name].isAlive) {
          this.attack(player, target, systemValue.damageType.werewolves_axe.id);
          gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined);
        };
      };
    });
  };
  getWinner() {
    const {werewolf, madman, vampire, villager, timeTraveler} = this.getJobStatus();
    if (this.#config.job.timeTraveler >= 1 && timeTraveler <= 0) {//タイムトラベラー死亡
      return systemValue.job.werewolf.id;

    } else if ((werewolf <= 0 && madman <= 0) || villager <= 0) {//人狼陣営、村人陣営どちらかが全滅

      if (vampire >= 1) {//吸血鬼の勝利
        return systemValue.job.vampire.id;

      } else if (villager >= 1) {//村人の勝利
        return systemValue.job.villager.id;

      } else {//人狼の勝利
        return systemValue.job.werewolf.id;

      };
    } else {
      return false;
    }
  }
  getJobStatus() {
    const status = {
      werewolf: 0,
      madman: 0,
      vampire: 0,
      villager: 0,
      timeTraveler: 0
    };
    this.activePlayers.forEach(gameplayer => {
      status[gameplayer.job]++
    });
    return status;
  };
  /**
   * 
   * @param {{"jobId":string, "isAlive":boolean}} queryOptions 
   */
  queryPlayer(queryOptions) {
    const {jobId, isAlive} = queryOptions;
    return Object.values(this.#players).filter(gameplayer => {
      if (jobId && gameplayer.job != jobId) {
        return false;
      };
      if (isAlive != undefined && gameplayer.isAlive != isAlive) {
        return false;
      };
      return true;
    });
  };
  updateSign() {
    const signs = this.#config.mapJson.map.sign.player
    const targets = Object.keys(this.#players).splice(this.#game.switchSign*signs.length, signs.length)
    for (let i = 0; i < signs.length; i++) {
      const name = targets[i];
      const location = signs[i];
      const block = world.getDimension("overworld").getBlock(location);
      const sign = block.getComponent("sign");
      sign.setText(`§f${name ? name : ""}`);
      sign.setWaxed(true);
    };
  };
  /**
   * 
   * @param {number} signNumber 
   * @returns {gamePlayer}
   */
  getPlayerFromSign(signNumber) {
    const signs = this.#config.mapJson.map.sign.player;
    const targets = Object.values(this.#players).splice(this.#game.switchSign*signs.length, signs.length);
    return targets[signNumber]
  }

  flashbang(location, power) {
    const now = new Date().getTime();
    world.getDimension("overworld").spawnParticle("minecraft:large_explosion", location);
    world.getDimension("overworld").playSound("firework.blast", location);
    world.getDimension("overworld").getPlayers({location:location, maxDistance:power}).forEach(player => {
      if (player.name in this.#players && this.#players[player.name].isAlive) {
        this.#players[player.name].setStun(now+5*1000);
        player.addEffect("blindness", 4.5*20, {amplifier: 2, showParticles: false});
      };
    });
  };
























  addGameLog(logText) {
    this.#gameLog.push(`${this.#game.date}日目(${systemValue.game.time[this.#game.timeID].display}):${logText}`);
  };

  /**
   * 
   * @param {PlayerSpawnAfterEvent} ev 
   */
  MCEV_playerSpawn_(ev) {
    if (!ev.initialSpawn) return;
    try {
      ev.player.inputPermissions.movementEnabled = true
    } catch {}
    ev.player.setGameMode(this.#game.status == systemValue.game.status.play ? GameMode.spectator : GameMode.adventure);
    ev.player.getComponent("inventory").container.clearAll();
    ev.player.teleport(this.#config.mapJson.map.spawn, {dimension:world.getDimension("overworld"),rotation:{x:0, y:0}});
    ev.player.getComponent("inventory").container.addItem(new ItemStack("feather:menubook"));

  };
  /**
   * 
   * @param {PlayerLeaveAfterEvent} ev 
   */
  MCEV_playerLeave_(ev) {
    if (this.#game.status == systemValue.game.status.play && ev.playerName in this.#players && this.#players[ev.playerName].isAlive) {
      this.#players[ev.playerName].leave();
    };
  };
  MCEV_worldInitialize() {
    this.#reset();
    world.getAllPlayers().forEach(player => {
      player.setGameMode(GameMode.adventure);
      player.teleport(this.#config.mapJson.map.spawn, {dimension:world.getDimension("overworld"),rotation:this.#config.mapJson.map.rotation});
      player.getComponent("inventory").container.addItem(new ItemStack("feather:menubook"));
    });
  };
  /**
   * 
   * @param {PlayerInteractWithBlockBeforeEvent} ev 
   */
  MCEV_beforeEvents_playerInteractWithBlock_(ev) {
    const block = ev.block;
    if (block.getComponent("inventory")) {
      ev.cancel = true;
    }
  }

  /**
   * 
   * @param {EntityHurtAfterEvent} ev 
   */
  MCEV_entityHurt_(ev) {
    const entity = ev.damageSource.damagingEntity;
    const target = ev.hurtEntity;


    const gameplayer = entity && entity.typeId == "minecraft:player" && entity.name in this.#players ? this.#players[entity.name] : undefined;
    const isAlive = gameplayer && gameplayer.isAlive;
    const target_gameplayer = target && target.typeId =="minecraft:player" && target.name in this.#players ? this.#players[target.name] : undefined;


    if (isAlive) {//攻撃者がプレイヤー
      const item = gameplayer.Inventory.getEquipment(EquipmentSlot.Mainhand);
      const damageType = systemValue.damageType;
      if (item) {
        const itemId = item.typeId;
        if (itemId == "feather:werewolves_axe") {
          this.attack(entity, target, damageType.werewolves_axe.id);
          gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand);

        } else if (itemId == "feather:vampire_killer") {
          this.attack(entity, target, damageType.vampire_killer.id);
          gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand);

        } else if (itemId == "minecraft:trident") {
          this.attack(entity, target, damageType.grudge.id);
          gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand);

        } else {
          this.attack(entity, target, damageType.default.id);
        };
      } else {
        this.attack(entity, target, damageType.default.id);
      };

    } else if (!isAlive && target_gameplayer) {//攻撃者がプレイヤー以外かつターゲットがプレイヤー
      if (entity.typeId == "feather:ghost") {//攻撃者がゴースト
        this.attack(entity, target, systemValue.damageType.curse.id);
      }

    }
  }



  /**
   * @param {ProjectileHitEntityAfterEvent} ev 
   */
  MCEV_projectileHitEntity_(ev) {
    const player = ev.source;
    const target = ev.getEntityHit().entity;
    const projectile = ev.projectile;

    const gameplayer = player.typeId == "minecraft:player" && player.name in this.#players ? this.#players[player.name] : undefined;
    const isAlive = gameplayer && gameplayer.isAlive;
    const target_gameplayer = target.typeId == "minecraft:player" && target.name in this.#players ? this.#players[target.name] : undefined;

    if (projectile.typeId == "minecraft:arrow") {//弓矢
      if (!player || !target) {
        if (projectile.isValid()) {
          projectile.remove();
        };
        return;
      };
      if (isAlive) {
        if (target_gameplayer) {
          this.attack(player, target, systemValue.damageType.arrow.id);

        } else if (target.typeId == "feather:ghost") {
          this.#emeraldChance(target.location);

        }
      }
      projectile.remove();

    } else if (projectile.typeId == "minecraft:snowball") {//スタングレネード
      this.flashbang(ev.location, 3);

    } else if (projectile.typeId == "minecraft:thrown_trident") {//怨念の槍
      this.attack(player, target, systemValue.damageType.grudge.id);
      projectile.remove();

    };
  };

  /**
   * 
   * @param {ProjectileHitBlockAfterEvent} ev 
   */
  MCEV_projectileHitBlock_(ev) {
    const player = ev.source;
    const gameplayer = player.typeId == "minecraft:player" && player.name in this.#players ? this.#players[player.name] : undefined;
    const isAlive = gameplayer && gameplayer.isAlive;
    if (ev.projectile.typeId == "minecraft:snowball") {
      this.flashbang(ev.location, 3);
    } else if (ev.projectile.typeId == "minecraft:arrow") {
      ev.projectile.remove()
    } else if (ev.projectile.typeId == "minecraft:thrown_trident") {//怨念の槍
      ev.dimension.playSound("item.trident.return", ev.location, {volume:1});
      if (isAlive) {
        const {typeId, amount, durability, enchant, nameTag, price, lore, name, icon} = this.#config.mapJson.items.trident;
        const item = new createItem(typeId, amount).setDurability(durability).setLore(lore).setNameTag(nameTag);
        item.addEnchant(enchant);
        if (gameplayer.Inventory.container.emptySlotsCount >= 1) {
          gameplayer.Inventory.container.addItem(item.Item)
        } else {
          player.dimension.spawnItem(item, player.location);
        };
      };
      ev.projectile.remove();

    };
  };



  /**
   * イベント受け取り用
   * @param {EntityHitEntityAfterEvent} ev 
   */
  MCEV_entityHitEntity_(ev) {
    const entity = ev.damagingEntity;
    const target = ev.hitEntity;
    if (entity.typeId == "minecraft:player" && entity.name in this.#players && this.#game.status == systemValue.game.status.play) {
      const gameplayer = this.#players[entity.name];
      const item = gameplayer.Inventory.getEquipment(EquipmentSlot.Mainhand);
      if (target.typeId == "feather:game_shop") {
        this.#shop.showForm(gameplayer);

      } else if (target.typeId == "feather:sign_click_box") {
        const signNumber = target.getDynamicProperty("signNumber")
        const target_gameplayer = this.getPlayerFromSign(signNumber);
        if (!target_gameplayer) return;
        if (target_gameplayer.name == gameplayer.name) {
          if (target_gameplayer.grim_geaper >= 1) {
            target_gameplayer.clear_grim_geaper_curse();
            target_gameplayer.sendMessage("死神の呪い解除した");
            this.addGameLog(`${target_gameplayer.name} が呪いを解除しました`);

          }
        }
        if (item) {
          if (this.#game.timeID != systemValue.game.time.night.id) {
            gameplayer.sendMessage("夜ではないため使用できません");
            return;
          };
          if (target_gameplayer.name == gameplayer.name ) {
            gameplayer.sendMessage("自分自身には使用できません");
            return;
          };
          if (item.typeId == "feather:divination") {//占い
            const divination = target_gameplayer.divination();
            const jobData = systemValue.job[divination]
            const sendText = `${target_gameplayer.name} は ${jobData.color}${jobData.displayId}§f です`;
            if (target_gameplayer.revelation) {
              target_gameplayer.sendMessage("誰かに占われたようだ...");
            };
            gameplayer.sendMessage(sendText);
            gameplayer.player.onScreenDisplay.setTitle(sendText)
            this.addGameLog(`${gameplayer.name} が  ${target_gameplayer.name} を占いました`);
            gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined)
            gameplayer.player.playSound("block.enchanting_table.use", {location:gameplayer.player.location, volume:1});
  
          } else if (item.typeId == "feather:knight_protection") {//騎士の祈り
            target_gameplayer.addKnightProtection();
            const sendText = `${target_gameplayer.name} に加護を付与しました`;
            gameplayer.sendMessage(sendText);
            this.sendGameMessage(sendText, true);
            gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined)
            this.addGameLog(`${gameplayer.name} が  ${target_gameplayer.name} に加護を付与しました`);
            gameplayer.player.playSound("random.anvil_land", {location:gameplayer.player.location, volume:1});
  
          } else if (item.typeId == "feather:grim_geaper_s_gey") {//死神の鍵
            target_gameplayer.grim_geaper_curse();
            gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined);
            const message = `${target_gameplayer.name} に死神の呪いをかけた`;
            gameplayer.sendMessage(message);
            this.addGameLog(message);
            this.sendGameMessage(message, true);
            gameplayer.player.playSound("mob.elderguardian.curse", {location:gameplayer.player.location, volume:1});
  
          }

        } else {}
      }
    }
  }

  /**
   * 
   * @param {ItemUseAfterEvent} ev 
   */
  MCEV_itemUse_(ev) {
    const item = ev.itemStack;
    const player = ev.source;
    const gameplayer = player.name in this.#players ? this.#players[player.name] : undefined;
    const isAlive = gameplayer && gameplayer.isAlive;
    if (item.typeId == "feather:menubook") {
      const form = new ActionFormData();
      form.button("discord");
      form.button("ゲーム設定");
      form.button("キャラ設定");
      form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection == 0) {
          function createToken(player) {
            discord.request("authentication", player.name).then(res => {
              const form = new MessageFormData();
              form.body(`deiscordの認証チャンネルで認証して下さい\n有効期限は生成から2分です\nTOKEN: ${res.body}`);
              form.button2("新しいコードを取得");
              form.button1("閉じる");
              form.show(player).then(res => {
                if (res.canceled) return;
                if (res.selection) {
                  createToken(player);
                };
              });
            });
          };
          createToken(player);

        } else if (res.selection == 1) {
          const form = new ModalFormData();
          form.slider("人狼", 1, 3, 1, this.#config.job.werewolf);
          form.slider("共犯者", 0, 3, 1, this.#config.job.madman);
          form.slider("吸血鬼", 0, 3, 1, this.#config.job.vampire);
          form.slider("タイムトラベラー(確率)", 0, 100, 5, this.#config.timeTraveler);
          form.slider("日数制限\n0にすると制限なし", 0, 30, 1, this.#config.escapeDay);
          form.toggle("スタート", false);
          form.show(player).then(res => {
            if (res.canceled) return;
            this.#config.job.werewolf = res.formValues[0];
            this.#config.job.madman = res.formValues[1];
            this.#config.job.vampire = res.formValues[2];
            this.#config.timeTraveler = res.formValues[3];
            this.#config.escapeDay = res.formValues[4];
            if (res.formValues[5]) {
              this.setUp();
            };
          });


        } else if (res.selection == 2) {
          character_form_main(player);
        };
      });

    } else if (isAlive && item.typeId == "feather:madmans_eye") {
      const targets = this.queryPlayer({jobId:systemValue.job.werewolf.id});
      if (targets.length <= 0) return;
      const target = targets[Math.floor(Math.random()*targets.length)].player.name;
      gameplayer.sendMessage(`人狼は ${target} です`);
      gameplayer.addGameLog(`人狼は ${target} です`);
      this.addGameLog(`${player.name} が 共犯の目を使用しました => ${target}`);
      gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined);
      player.playSound("mob.elderguardian.curse", {location:player.location, volume:1});



    } else if (isAlive && item.typeId == "feather:mediumship") {
      const targets = this.queryPlayer({isAlive:false}).map(gameplayer => gameplayer.name);
      if (targets.length >= 1) {
        gameplayer.sendMessage(`死亡者\n${targets.join("\n")}`);
      } else {
        gameplayer.sendMessage(`誰も死亡していません`);
      };
      const message = `${gameplayer.name} が霊媒師の遺灰を使用しました`;
      this.addGameLog(message);
      this.sendGameMessage(message, true);
      gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined);
      player.playSound("mob.vex.ambient", {location:player.location, volume:3});

    } else if (isAlive && item.typeId == "feather:revelation") {//天啓の呪符
      if (this.#game.timeID == systemValue.game.time.night.id) {
        gameplayer.setRevelation(true);
        const message = `${gameplayer.name} が天啓の呪符を使用しました`;
        this.addGameLog(message);
        this.sendGameMessage(message, true);
        gameplayer.Inventory.setEquipment(EquipmentSlot.Mainhand, undefined);
      } else {
        gameplayer.sendMessage("夜ではないため使用できません");
      };
    };
    
  };
  /**
   * 
   * @param {ItemCompleteUseAfterEvent} ev 
   */
  MCEV_itemCompleteUse_(ev) {
    const item = ev.itemStack;
    const player = ev.source;
    if (player.typeId == "minecraft:player" && player.name in this.#players) {
      if (item.typeId == "minecraft:cooked_beef") {
        this.#players[player.name].heal(8)
      } else if (item.typeId == "feather:invisible_potion") {
        player.addEffect("invisibility", 20*20, {amplifier: 1, showParticles: false});
      }
    }
  }
  /**
   * 
   * @param {Player | Entity} source 
   * @param {Player | Entity} target 
   * @param {string} damageTypeID 
   */
  attack(source, target, damageTypeID = systemValue.damageType.others) {
    if (!target) return;
    if (target.typeId == "minecraft:player" && target.name in this.#players) {
      const sourceName = !source ? "???" : source.typeId == "minecraft:player" ? source.name : source.typeId == "feather:ghost" ? "ゴースト" : source.typeId;
      const GPlayer = this.#players[target.name];
      

      if (!GPlayer.isAlive) {
        return
      }

      const deathText = `§4${target.name} は ${sourceName} ${systemValue.damageType[damageTypeID].deathText}`;
      const died = GPlayer.applyDamage(damageTypeID, this.#game.timeID, deathText);
      // if (died) {
      //   this.addGameLog(deathText);
      //   this.sendGameMessage(deathText, true);
      // };
    } else if (target && target.typeId == "feather:ghost") {
      let health = target.getDynamicProperty("health");
      if (health != undefined) {
        health -= damageTypeID in systemValue.damageType ? systemValue.damageType[damageTypeID].damage : 1;
        if (health <= 0) {
          this.#emeraldChance(target.location);
          target.remove();
        } else {
          target.setDynamicProperty("health", health);
        }
      } else {
        target.setDynamicProperty("health", 3);
      }
    }
  };

  playerDieEvent() {}

  /**
   * 
   * @param {string} text 
   * @param {boolean} spectatoroOly 
   */
  sendGameMessage(text, spectatoroOly) {
    world.getAllPlayers().forEach(player => {
      if (player.name in this.#players) {
        const Gplayer = this.#players[player.name];
        if ( !spectatoroOly || !Gplayer.isAlive) {
          Gplayer.sendMessage(text);
        };

      } else {
        player.sendMessage(text);
      };
    });
  };



  getEquipmentItem(player = Player.prototype, targetSlot = EquipmentSlot) {
    return player.getComponent("equippable").getEquipment(targetSlot);
  }

}
