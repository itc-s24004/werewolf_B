import { Entity } from "@minecraft/server";

export const DP = {
  /**
   * 
   * @param {Entity} entity 
   * @param {[string] | undefined} DPID_List 
   */
  getDPObj(entity = Entity.prototype, DPID_List) {
    const DPObj = {};
    if (!DPID_List || !Array.isArray(DPID_List) || DPID_List.length <= 0) {
      DPID_List = entity.getDynamicPropertyIds();
    }
    DPID_List.forEach(DPID => {
      const v = entity.getDynamicProperty(DPID);
      DPObj[DPID] = v != undefined ? v : null;
    })
    return DPObj
  }
}