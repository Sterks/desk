<template>
  <Story title="TNOverlay/Playground" group="other" :layout="{ type: 'grid', width: '90%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean
        v-model="state.transparent"
        title="transparent"
        field-type="Boolean"
        default-value="false"
        desc="Возможность сделать оверлей прозрачным"
      />
      <ControlFieldBoolean v-model="state.isOpen" title="isOpen" field-type="Boolean" default-value="false" desc="Открытие/закрытие оверлея" />
      <ControlFieldNumber v-model="state.zIndex" title="zIndex" field-type="number | string" default-value="30" desc="Значение z-index" />
    </template>
    <Variant title="TNOverlay" auto-props-disabled>
      <template #default="{ state }">
        <TNButton class="overlay-story-button" style="z-index: 9999999999999999" @click="state.isOpen = !state.isOpen">{{
          state.isOpen ? "Закрыть оверлей" : "Открыть оверлей"
        }}</TNButton>
        <TNOverlay v-bind="filterState(state)" />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import { filterState } from "../../../consts/consts";
import TNOverlay from "../overlay.vue";
</script>

<docs lang="md">
[Документация](./overlay.story.md)
</docs>
