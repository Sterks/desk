<template>
  <Story title="TNPopup/Playground" group="data" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.title" title="title" field-type="string" default-value="" desc="Заголовок для попапа" />
      <ControlFieldText v-model="state.subtitle" title="subtitle" field-type="string" default-value="" desc="Подзаголовок для попапа" />
      <ControlFieldSelect v-model="state.size" title="size" field-type="sm | md" default-value="md" desc="Размер попапа" :options="['sm', 'md']" />
      <ControlFieldJson v-model="state.buttons" title="buttons" field-type="ITNFloatingButton[]" desc="Массив кнопок для попапа" />
      <ControlFieldJson v-model="state.buttonsPosition" title="buttonsPosition" field-type="ITNFloatingPosition" desc="Позиция кнопок" />
      <ControlFieldBoolean v-model="state.back" title="back" field-type="boolean" default-value="false" desc="Отображение кнопки возвращения назад" />
      <ControlFieldBoolean v-model="state.closable" title="closable" field-type="boolean" default-value="true" desc='Отображение кнопки "назад"' />
      <ControlFieldNumber
        v-model="state.maxMobileWidth"
        title="maxMobileWidth"
        field-type="number"
        default-value="768"
        desc="Максимальная ширина в мобильном разрешении в px"
      />
      <ControlFieldBoolean v-model="state.isVisible" title="isVisible" field-type="boolean" required desc="Видимость попапа" />
      <ControlFieldNumber v-model="state.zIndex" title="zIndex" field-type="number | string" default-value="10003" desc="Величина z-index" />
      <ControlFieldText v-model="state.customClass" title="customClass" field-type="string" default-value="" desc="Кастомный класс для контейнера попапа" />
      <ControlFieldJson v-model="state.disabled" title="disabled" field-type="ITNPopupDisabled" default-value="{}" desc="Отключение слотов попапа" />
      <ControlFieldBoolean
        v-model="state.transparentBackground"
        title="transparentBackground"
        field-type="boolean"
        default-value="false"
        desc="Убирает затемнение вокруг компонентa"
      />
    </template>
    <Variant title="TNPopup" :init-state="() => popupDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNPopup v-bind="filterState(state)" @back="(goBack, logEvent('back', { $event }))" @close="((state.isVisible = false), logEvent('close', { $event }))">
          Работники могут оформить ежегодную компенсацию процентов по ипотеке. Она составит 1,5-5% от уплаченной суммы за год. Чем выше стаж работника, тем выше
          процент компенсации. То есть, ипотека с 10% годовых может превратиться в ипотеку с 5% годовых. Компенсация выплачивается раз в год за предыдущий
          календарный год.
          <template #footer></template>
        </TNPopup>
        <TNButton @click="state.isVisible = true">Открыть</TNButton>
      </template>
    </Variant>
    <Variant id="main" title="Отображение кнопок" :init-state="() => ({ ...popupDefaultState, buttons, buttonsPosition })" auto-props-disabled>
      <template #default="{ state }">
        <TNPopup v-bind="filterState(state)" @back="(goBack, logEvent('back', { $event }))" @close="((state.isVisible = false), logEvent('close', { $event }))">
          Работники могут оформить ежегодную компенсацию процентов по ипотеке. Она составит 1,5-5% от уплаченной суммы за год. Чем выше стаж работника, тем выше
          процент компенсации. То есть, ипотека с 10% годовых может превратиться в ипотеку с 5% годовых. Компенсация выплачивается раз в год за предыдущий
          календарный год.
        </TNPopup>
        <TNButton @click="state.isVisible = true">Открыть</TNButton>
      </template>
    </Variant>
    <Variant
      title="Блокировка областей компонента"
      :init-state="
        () => ({
          ...popupDefaultState,
          buttons,
          disabled: { footer: true, header: true }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopup v-bind="filterState(state)" @back="(goBack, logEvent('back', { $event }))" @close="((state.isVisible = false), logEvent('close', { $event }))">
          В этом попапе заблокированы хедер и футер.
        </TNPopup>
        <TNButton @click="state.isVisible = true">Открыть</TNButton>
      </template>
    </Variant>
    <Variant
      id="slot"
      title="Использование слотов"
      :init-state="
        () => ({
          ...popupDefaultState,
          buttons
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopup v-bind="filterState(state)" @back="(goBack, logEvent('back', { $event }))" @close="((state.isVisible = false), logEvent('close', { $event }))">
          <template #header>...</template>
          ...
          <template #footer>...</template>
        </TNPopup>
        <TNButton @click="state.isVisible = true">Открыть</TNButton>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import type { ITNFloatingButton, ITNFloatingPosition } from "../../floating-buttons/floating-buttons.types";

import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";

const popupDefaultState = {
  isVisible: false,
  back: true,
  size: "md",
  title: "Popup title",
  subtitle: "Popup subtitle"
};

const buttons: ITNFloatingButton[] = [
  {
    title: "Применить",
    click: () => {
      alert("Применить");
    }
  },
  {
    title: "Отменить",
    click: () => {
      alert("Отменить");
    },
    props: {
      loading: true
    }
  }
];

const buttonsPosition: ITNFloatingPosition = {
  mobile: "vertical"
};

function goBack() {
  alert("goBack");
}
</script>

<docs lang="md">
[Документация](./popup.story.md)
</docs>
