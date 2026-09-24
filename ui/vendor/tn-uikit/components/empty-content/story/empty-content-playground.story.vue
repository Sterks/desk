<template>
  <Story title="TNEmptyContent/Playground" group="data" :layout="{ type: 'grid', width: '60%' }" :auto-props-disabled="true">
    <template #controls="{ state }">
      <ControlFieldSelect
        v-model="state.type"
        title="type"
        field-type='"light" | "neutral" | "transparent"'
        :options="['light', 'neutral', 'transparent']"
        desc="Тип оформления компонента"
      />
      <ControlFieldSelect
        v-model="state.icon"
        title="icon"
        :field-type="emptyContentIconList.map(icon => `&quot;${icon}&quot;`).join(' | ')"
        :options="emptyContentIconList"
        desc="Используемая иконка"
      />
      <ControlFieldText v-model="state.title" title="title" field-type="String" desc="Заглавный текст" />
      <ControlFieldText v-model="state.text" title="text" field-type="String" desc="Уточняющий текст" />
      <ControlFieldJson v-model="state.buttons" title="buttons" field-type="ITNFloatingButton[]" default-value="[]" desc="Массив кнопок" />
    </template>
    <Variant
      v-for="icon in emptyContentIconList"
      :id="`main_${icon}`"
      :key="icon"
      :title="`TNEmptyContent: ${icon}`"
      :init-state="() => ({ ...initialValue, icon })"
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNEmptyContent v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant id="button" title="Отображение кнопок" :init-state="() => ({ ...initialValue, buttons })" auto-props-disabled>
      <template #default="{ state }">
        <TNEmptyContent v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant
      id="style"
      title="Изменение фона"
      :init-state="
        () => ({
          title: 'Ошибка с серым фоном',
          type: 'neutral'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNEmptyContent v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant
      id="icon"
      title="Выбор иконки"
      :init-state="
        () => ({
          icon: 'empty-alert'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNEmptyContent v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant id="icon-slot" title="Отображение иконки через слот" auto-props-disabled>
      <template #default>
        <TNEmptyContent>
          <template #icon>
            <TNIcon name="warning-filled" />
          </template>
        </TNEmptyContent>
      </template>
    </Variant>
    <Variant id="slot" title="Отображение кнопки через слот" auto-props-disabled>
      <template #default>
        <TNEmptyContent>
          <template #buttons>
            <div class="custom-buttons">
              <TNButton>Первая кнопка</TNButton>
              <div class="something-else">...</div>
              <TNButton>Вторая кнопка</TNButton>
            </div>
          </template>
        </TNEmptyContent>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import TNEmptyContent from "../empty-content.vue";
import { filterState } from "../../../consts/consts";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import type { ITNFloatingButton } from "../../floating-buttons/floating-buttons.types";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { emptyContentIconList } from "../empty-content.types";

const initialValue = {
  title: "Главный текст",
  text: "Дополнительный текст"
};

const buttons: ITNFloatingButton[] = [
  {
    title: "Красная кнопка",
    click: () => {
      alert("Красная кнопка");
    }
  },
  {
    title: "Серая кнопка",
    click: () => {
      alert("Серая кнопка");
    },
    props: {
      secondary: true
    }
  }
];
</script>

<style scoped></style>

<docs lang="md">
[Документация](./empty-content.story.md)
</docs>
