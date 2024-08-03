import { Player, world } from "@minecraft/server"
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

/**
 * 
 * @param {Player} player 
 */
export function character_form_main(player) {
  const form = new ActionFormData();
  form.button("表示設定");
  form.button("服");
  form.button("アクセサリー");
  form.button("マント");
  form.show(player).then(res => {
    if (res.canceled) return;
    if (res.selection == 0) {
      new character_form(character_form_data.textureSetting).show(player);

    } else if (res.selection == 1) {
      new character_form(character_form_data.clothes).show(player);
      
    } else if (res.selection == 2) {
      new character_form(character_form_data.hat).show(player);
      
    } else if (res.selection == 3) {
      new character_form(character_form_data.cape).show(player);
      
    }
  })
}


class character_form {
  #form;
  #formData
  constructor(formData=character_form_data.hat) {
    this.#form = new ModalFormData()
    this.#formData = formData;
    const {title, body, label, type, button} = formData;
    if (type == "toggle") {
      button.forEach(buttondata => {
        this.#form.toggle(buttondata.text, false);
      })
    } else if (type == "dropdown") {
      const op = []
      button.forEach(data => {
        op.push(data.text);
      })
      this.#form.dropdown(label, op);
    }
  }
  /**
   * 
   * @param {Player} player 
   */
  show(player) {
    this.#form.show(player).then(res => {
      if (res.canceled) return
      
      const {title, body, label, type, button} = this.#formData

      if (type == "toggle") {
        let i = 0;
        button.forEach(data => {
          player.triggerEvent(data.event[res.formValues[i]]);
          i++;
        });
      } else if (type == "dropdown") {
        player.triggerEvent(button[res.formValues[0]].event);
      };
    });
  }
}


const character_form_data = {
  textureSetting: {
    title: "",
    body: "",
    label: "",
    type: "toggle",
    button: [
      {text: "帽子", event: {true: "hat:show", false: "hat:hide"}},
      {text: "ジャケット", event: {true: "jacket:show", false: "jacket:hide"}},
      {text: "スリーブ(右)", event: {true: "sleeve_r:show", false: "sleeve_r:hide"}},
      {text: "スリーブ(左)", event: {true: "sleeve_l:show", false: "sleeve_l:hide"}},
      {text: "ズボン(右)", event: {true: "pants_r:show", false: "pants_r:hide"}},
      {text: "ズボン(左)", event: {true: "pants_l:show", false: "pants_l:hide"}},
    ],
  },
  cape: {
    title: "",
    body: "",
    label: "マント",
    type: "dropdown",
    button: [
      {text: "なし", event: "cape:none"},
      {text: "人狼", event: "cape:werewolf"},
      {text: "IT-College", event: "cape:itcollege"},
    ],
  },
  clothes: {
    title: "",
    body: "",
    label: "服",
    type: "dropdown",
    button: [
      {text: "なし", event: "clothes:set0"},
      {text: "浴衣(白)", event: "clothes:set1"},
      {text: "浴衣(黒)", event: "clothes:set2"},
    ],
  },
  hat: {
    title: "",
    body: "",
    label: "帽子",
    type: "dropdown",
    button:[
      {text: "なし", event: "hat:none"},
      {text: "クリーパーのお面", event: "hat:mask_creeper"},
      {text: "オオカミのお面", event: "hat:mask_wolf"},
      {text: "???のお面", event: "hat:mask_megaoba"},
    ]
  }
}