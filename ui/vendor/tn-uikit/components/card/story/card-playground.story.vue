<template>
  <Story title="TNCard/Playground" group="data" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldSelect
        v-model="state.padding"
        title="padding"
        field-type="0 | 4 | 8 | 12 | 16 | 32 | 40"
        default-value="16"
        desc="Отступ внутри карточки"
        :options="['0', '4', '8', '12', '16', '32', '40']"
      />
      <ControlFieldSelect
        v-model="state.borderRadius"
        title="borderRadius"
        field-type="0 | 4 | 8 | 12 | 16"
        default-value="16"
        desc="Скругление углов карточки"
        :options="['0', '4', '8', '12', '16']"
      />
      <ControlFieldBoolean
        v-model="state.active"
        title="active"
        field-type="boolean"
        default-value="false"
        desc="Интерактивность карточки (смена цвета при наведении/клике)"
      />
      <ControlFieldBoolean v-model="state.selected" title="selected" field-type="boolean" default-value="false" desc="Состояние выбранной карточки" />
      <ControlFieldBoolean v-model="state.secondary" title="secondary" field-type="boolean" default-value="false" desc="Второстепенный цвет" />
    </template>
    <Variant title="TNCard" auto-props-disabled>
      <template #default="{ state }">
        <div class="card-wrapper">
          <TNCard v-bind="filterState(state)"> Любой контент </TNCard>
        </div>
      </template>
    </Variant>
    <Variant title="Интерактивная карточка" :init-state="() => ({ active: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="card-wrapper">
          <TNCard v-bind="filterState(state)"> Любой контент </TNCard>
        </div>
      </template>
    </Variant>
    <Variant title="Выбранная карточка" :init-state="() => ({ selected: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="card-wrapper">
          <TNCard v-bind="filterState(state)"> Любой контент </TNCard>
        </div>
      </template>
    </Variant>
    <Variant title="Второстепенный цвет карточки" :init-state="() => ({ secondary: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNCard v-bind="filterState(state)"> Любой контент </TNCard>
      </template>
    </Variant>
    <Variant
      id="style"
      title="Карточка с заданными скруглением и отступом"
      :init-state="
        () => ({
          padding: 32,
          borderRadius: 24,
          active: true
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNCard v-bind="filterState(state)"> Любой контент </TNCard>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
</script>

<style scoped>
.card-wrapper {
  padding: 20px;
  background-color: var(--background-secondary-enabled);
}
</style>

<docs lang="md">
[Документация](./card.story.md)
</docs>
