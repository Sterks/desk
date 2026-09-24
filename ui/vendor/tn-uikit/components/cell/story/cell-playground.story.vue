<template>
  <Story title="TNCell/Playground" group="data" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean
        v-model="state.dropdown"
        title="dropdown"
        field-type="boolean"
        desc="Форматирование ячейки для использования в компоненте TNDropdown"
      />
      <ControlFieldUnavailable desc="Название тега для корневого элемента компонента" default-value="div" title="tagName" field-type="string (тег элемента)" />
      <ControlFieldJson v-model="state.cellData" title="cellData" field-type="ICellDataItem" required desc="Данные ячейки" />
      <ControlFieldText v-model="state.cellData.title" title="cellData.title" field-type="string" default-value="" required desc="Главный текст ячейки" />
      <ControlFieldText v-model="state.cellData.subtitle" title="cellData.subtitle" field-type="string" default-value="" desc="Текст описания ячейки" />
      <ControlFieldBoolean v-model="state.cellData.disabled" title="cellData.disabled" field-type="boolean" desc="Отключение компонента" />
      <ControlFieldBoolean v-model="state.cellData.accent" title="cellData.accent" field-type="boolean" desc="Включение accent стиля" />
      <ControlFieldSelect
        v-model="state.cellData.rightIconsAlignment"
        title="cellData.rightIconsAlignment"
        :options="['top', 'center']"
        field-type="String"
        desc="Выравнивание иконок справа"
      />
    </template>
    <Variant id="main" title="TNCell" :init-state="() => ({ cellData: cellDefaultValue })" auto-props-disabled>
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          v-bind="filterState(state)"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="action" title="Чекбокс/Радио/Тумблер" auto-props-disabled>
      <template #default>
        <TNCell
          :cell-data="{
            title: 'Изменить виджет',
            subtitle: 'Пример или подсказка',
            id: '1',
            checkbox: true,
            checked: false
          }"
        />
        <TNCell
          :cell-data="{
            title: 'Изменить виджет',
            subtitle: 'Пример или подсказка',
            id: '1',
            radiobutton: true,
            checked: false
          }"
        />
        <TNCell
          :cell-data="{
            title: 'Изменить виджет',
            subtitle: 'Пример или подсказка',
            id: '1',
            tumbler: true,
            checked: false
          }"
        />
      </template>
    </Variant>
    <Variant
      id="disabled"
      title="Отключенный TNCell (disabled)"
      :init-state="() => ({ cellData: { ...cellDefaultValue, disabled: true } })"
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="disabled-array"
      title="TNCell с отключенными иконками"
      :init-state="
        () => ({
          cellData: {
            ...cellIconsDisabled,
            disabled: ['more-horizontal', 'right-m']
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant title="TNCell с тумблером и радио-кнопкой" :init-state="() => ({ cellData: cellControlsDisabled })" auto-props-disabled>
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="icon" title="TNCell с иконками" :init-state="() => ({ cellData: cellIcons })" auto-props-disabled>
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="avatar" title="TNCell с аватаром пользователя (TNUserPicture)" :init-state="() => ({ cellData: cellUserImage })" auto-props-disabled>
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="((state.cellData.checked = $event.value), logEvent('input', { $event }))"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="chat"
      title="TNCell в режиме чата"
      :init-state="
        () => ({
          cellData: cellChat
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="logEvent('input', { $event })"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="click"
      title="TNCell с кликом"
      :init-state="
        () => ({
          cellData: {
            title: 'Изменить виджет',
            subtitle: 'Пример или подсказка',
            id: '1'
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNCell
          :cell-data="state.cellData"
          @input="logEvent('input', { $event })"
          @body-click="logEvent('bodyClick', { $event })"
          @icon-click="logEvent('iconClick', { $event })"
          @click="logEvent('clickHandler', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { logEvent } from "histoire/client";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import "../../../.histoire/assets/images/kapibara_s_apelsinom.png";
import { filterState } from "../../../consts/consts";

const imageUrl = "../../.histoire/assets/images/kapibara_s_apelsinom.png";

const cellDefaultValue = {
  title: "Cell title",
  subtitle: "Cell subtitle",
  id: "1",
  checked: false
};

const cellIconsDisabled = {
  ...cellDefaultValue,
  leftIcon: "edit-2",
  rightIcons: ["more-horizontal", "right-m"]
};

const cellControlsDisabled = {
  ...cellDefaultValue,
  tumbler: true,
  radiobutton: true,
  disabled: ["tumbler", "radio"]
};

const cellIcons = {
  ...cellDefaultValue,
  leftIcon: "edit-2",
  rightIcons: ["more-horizontal", "right-m"]
};

const cellUserImage = {
  ...cellDefaultValue,
  userPicture: {
    image: imageUrl
  }
};

const cellChat = {
  ...cellUserImage,
  chat: {
    status: 3,
    pinned: true,
    notification: 11,
    body: "Текст сообщения",
    muted: false,
    time: {
      // Тут должен быть объект Date, но из-за формата доки оно отображается как пустой объект
      getTime(): number {
        return 11111111111111;
      },
      getHours(): number {
        return 11;
      },
      getMinutes(): number {
        return 11;
      },
      getSeconds(): number {
        return 11;
      }
    }
  }
};
</script>

<docs lang="md">
[Документация](./cell.story.md)
</docs>
