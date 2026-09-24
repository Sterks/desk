import { createApp } from "vue";
import SVGSpriteComponent from "./sprite/sprite.vue";

export const elementID = "svg--iconpack";
let _isSpriteInserted = false;

function isSpriteInserted(): boolean {
  return _isSpriteInserted;
}

export function addSVGSpriteToBody() {
  if (isSpriteInserted()) {
    return;
  }

  const sprite = document.createElement("div");
  sprite.setAttribute("id", elementID);

  document.body.insertBefore(sprite, document.body.firstChild);

  setTimeout(function () {
    mountSprite(elementID);
  }, 1);
}

function mountSprite(eid: string) {
  if (isSpriteInserted()) {
    return;
  }
  _isSpriteInserted = true;
  createApp(SVGSpriteComponent).mount(`#${eid}`);
}

export { default as TNIcon } from "./icon.vue";
