<template>
  <Story title="Transitions/Playground" group="other" :layout="{ type: 'grid', width: '90%' }">
    <template #controls></template>
    <Variant title="TransitionCollapse" auto-props-disabled>
      <TNCard secondary padding="8">
        <TNButton block @click="isCollapsed = !isCollapsed">{{ isCollapsed ? "Развернуть" : "Свернуть" }}</TNButton>
        <TransitionCollapse>
          <div v-if="!isCollapsed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum.
          </div>
        </TransitionCollapse>
      </TNCard>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import TransitionCollapse from "../transition-collapse.vue";
import TNCard from "../../card/card.vue";
import { ref } from "vue";
import TNButton from "../../button/button.vue";

const isCollapsed = ref<boolean>(false);
</script>

<style scoped></style>

<docs lang="md">
[Документация](./transitions.story.md)
</docs>
