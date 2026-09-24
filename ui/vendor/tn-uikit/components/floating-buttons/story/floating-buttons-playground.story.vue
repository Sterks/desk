<template>
  <Story title="TNFloatingButtons/Playground" group="form" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldSelect
        v-model="state.position"
        title="position"
        field-type="vertical | horizontal"
        default-value="horizontal"
        desc="Расположение кнопок - вертикально/горизонтально"
        :options="['vertical', 'horizontal']"
      />
      <ControlFieldText
        v-model="state.maxMobileWidth"
        title="maxMobileWidth"
        field-type="number"
        default-value="768"
        desc="Максимальная ширина мобильного разрешения в пикселях"
      />
      <ControlFieldText
        v-model="state.borderRadius"
        title="borderRadius"
        field-type="string | number"
        default-value="16"
        desc="Радиус скругления углов в пикселях"
      />
      <ControlFieldBoolean
        v-model="state.addShadow"
        title="addShadow"
        field-type="boolean"
        default-value="false"
        desc="Добавить тень родительскому контейнеру с кнопками"
      />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Отключение кнопок" />
      <ControlFieldJson v-model="state.buttons" title="buttons" field-type="ITNFloatingButton[]" required desc="Массив с кнопками" />
    </template>
    <Variant title="TNFloatingButtons" :init-state="() => ({ buttons, position: 'horizontal' })" auto-props-disabled>
      <template #default="{ state }">
        <TNCard style="padding: 50px; background: none; border: none">
          <TNFloatingButtons v-bind="filterState(state)" />
        </TNCard>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { ITNFloatingButton } from "../floating-buttons.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";

const buttons = ref<ITNFloatingButton[]>([
  {
    title: "Отменить",
    click: () => {
      alert("Клик по кнопке отмены");
    }
  },
  {
    title: "Подтвердить",
    props: {
      disabled: true,
      icon: "heart"
    },
    click: () => {
      alert("Клик по кнопке подтверждения");
    }
  }
]);
</script>

<docs lang="md">
[Документация](./floating-buttons.story.md)

## Использование

Используются как элемент интерфейса, когда нужно показать целевые действия
зафиксированными снизу. Чаще всего используется в `Popup` и `Bottomsheet`.

Компонент принимает любое количество кнопок, с возможностью проброса
для них текста `title`, `props` и метода `click`.

По умолчанию для кнопки проставляются аттрибуты: `size`: `lg`, `block` и `action`.
В случае, если кнопок две, первая по умолчанию проставится как `outline`.

```ts
const buttons = ref<ITNFloatingButton[]>([
  {
    title: "Отменить",
    click: () => {
      alert("Клик по кнопке отмены");
    }
  },
  {
    title: "Подтвердить",
    props: {
      disabled: true,
      icon: "heart"
    },
    click: () => {
      alert("Клик по кнопке подтверждения");
    }
  }
]);
```

```vue
<TNFloatingButtons :buttons="buttons" />
```

## Расположение

Имеется возможность задавать положение кнопок - `vertical` или `horizontal` - с помощью пропа position.
Также можно прописать настройку отдельно для `mobile` и `desktop`.
По умолчанию - `horizontal`.
</docs>
