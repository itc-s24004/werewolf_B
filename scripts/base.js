import { GameMode, system, world } from "@minecraft/server";
import { gameSystem } from "./system";
import { ActionFormData } from "@minecraft/server-ui";
import { createItem } from "./dataClass/item";
// import {} from "@minecraft/server-net"


world.afterEvents.worldInitialize.subscribe(ev => {
  gameSystem.MCEV_worldInitialize()
})

world.afterEvents.entityHitEntity.subscribe(ev => {
  gameSystem.MCEV_entityHitEntity_(ev)
})

world.afterEvents.entityHurt.subscribe(ev => {
  gameSystem.MCEV_entityHurt_(ev);
});

world.afterEvents.itemUse.subscribe(ev => {
  gameSystem.MCEV_itemUse_(ev);
});

world.afterEvents.projectileHitEntity.subscribe(ev => {
  gameSystem.MCEV_projectileHitEntity_(ev);
});

world.afterEvents.projectileHitBlock.subscribe(ev => {
  gameSystem.MCEV_projectileHitBlock_(ev);
});

world.afterEvents.itemCompleteUse.subscribe(ev => {
  gameSystem.MCEV_itemCompleteUse_(ev)
})

world.afterEvents.playerSpawn.subscribe(ev => {
  gameSystem.MCEV_playerSpawn_(ev);
});

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
  gameSystem.MCEV_beforeEvents_playerInteractWithBlock_(ev);
});

world.afterEvents.playerLeave.subscribe(ev => {
  gameSystem.MCEV_playerLeave_(ev);
  
});

system.runInterval(() => {
  gameSystem.tickUpdate();
}, 1);