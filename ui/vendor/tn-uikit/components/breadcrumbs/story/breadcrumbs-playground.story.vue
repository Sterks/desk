<template>
  <Story title="TNBreadcrumbs/Playground" group="navigation" :layout="{ type: 'grid', width: '80%' }" auto-props-disabled>
    <template #controls="{ state }">
      <ControlFieldText v-model="state.root" title="root" field-type="string" default-value="/" desc='Ссылка корневого роута (иконка "home")' />
      <ControlFieldBoolean v-model="state.norouter" title="norouter" field-type="boolean" default-value="false" desc="Делает корневой роут ссылкой" />
      <ControlFieldJson v-model="state.breadCrumbsList" title="links" field-type="BreadcrumbsItem[]" desc="Cписок ссылок для навигации" default-value="[]" />
      <ControlFieldBoolean v-model="state.home" title="home" field-type="boolean" default-value="true" desc="Добавляет ссылку домой" />
    </template>
    <Variant title="TNBreadcrumbs" :init-state="() => ({ root: '/', breadCrumbsList: breadCrumbsList })" auto-props-disabled>
      <template #default="{ state }">
        <div class="card-wrapper">
          <TNBreadcrumbs :links="state.breadCrumbsList" :root="state.root" :norouter="state.norouter" :home="state.home" />
        </div>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";

const breadCrumbsList = [
  {
    to: { name: "Homepage" },
    text: "UIKit"
  },
  {
    text: "Элементы"
  },
  {
    text: "Хлебные крошки"
  }
];
</script>

<style scoped>
.card-wrapper {
  padding: 20px;
  background-color: var(--background-secondary-enabled);
}
</style>

<docs lang="md">
[Документация](./breadcrumbs.story.md)
</docs>
