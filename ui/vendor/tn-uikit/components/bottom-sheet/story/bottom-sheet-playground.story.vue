<template>
  <Story title="TNBottomSheet/Playground" group="data" :layout="{ type: 'grid', width: '90%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean v-model="state.isOpen" title="isOpen" field-type="boolean" required desc="Открытие/закрытие" />
      <ControlFieldBoolean
        v-model="state.fullHeight"
        title="fullHeight"
        field-type="boolean"
        default-value="false"
        desc="Полноразмерное отображение вне зависимости от наполненности контентом"
      />
      <ControlFieldBoolean
        v-model="state.isMobileMiniApp"
        title="isMobileMiniApp"
        field-type="boolean"
        default-value="false"
        desc='При передаче устанавливает больший отступ для мобильного веба (от top, что-бы учесть "шапку браузера")'
      />
      <ControlFieldJson
        v-model="state.header"
        title="header"
        field-type="{ title?: string; description?: string }"
        default-value="{}"
        desc="Заголовок и подзаголовок в шапке"
      />
      <ControlFieldText
        v-model="state.teleportTo"
        title="teleportTo"
        field-type="string"
        default-value="main"
        desc="Силами teleport Vue вставляет компонент в DOM-дерево"
      />
      <ControlFieldBoolean
        v-model="state.lockSwipe"
        title="lockSwipe"
        field-type="boolean"
        default-value="false"
        desc="Запрещает закрытие боттом-щита свайпом"
      />
      <ControlFieldBoolean
        v-model="state.showShadowOnScrollContent"
        title="showShadowOnScrollContent"
        field-type="boolean"
        default-value="false"
        desc="Добавляет отображение тени под шапкой header (если есть) боттом-щита при скролле"
      />
      <ControlFieldBoolean
        v-model="state.transparentBackground"
        title="transparentBackground"
        field-type="boolean"
        default-value="false"
        desc="Убирает затемнение вокруг компонентa"
      />
      <ControlFieldText
        v-model="state.customClass"
        title="customClass"
        field-type="string"
        default-value=""
        desc="Добавляет кастомный класс в элемент контейнера боттом-щита. То есть рядом с классом tn-bottom-sheet"
      />
    </template>

    <Variant title="TNBottomSheet" :init-state="() => bottomSheetDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="((state.isOpen = true), logEvent('click', { $event }))">Открыть</TNButton>
        <TNBottomSheet v-bind="filterState(state)" @hide="((state.isOpen = false), logEvent('hide', { $event }))">
          <p v-html="longText"></p>
        </TNBottomSheet>
      </template>
    </Variant>
    <Variant title="Использование всей высоты экрана" :init-state="() => ({ ...bottomSheetDefaultState, fullHeight: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNButton @click="((state.isOpen = true), logEvent('click', { $event }))">Открыть</TNButton>
        <TNBottomSheet v-bind="filterState(state)" @hide="((state.isOpen = false), logEvent('hide', { $event }))">
          <p v-html="longText"></p>
        </TNBottomSheet>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import { logEvent } from "histoire/client";
import { filterState } from "../../../consts/consts";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";

const bottomSheetDefaultState = {
  teleportTo: "body",
  header: { title: "Заголовок", description: "Краткое описание" }
};

const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas sed tempus urna et pharetra. Suscipit tellus mauris a diam maecenas sed. Porttitor eget dolor morbi non arcu risus quis. In ante metus dictum at. Neque laoreet suspendisse interdum consectetur libero. Fringilla urna porttitor rhoncus dolor purus non. Mauris pellentesque pulvinar pellentesque habitant morbi tristique. Aliquet nec ullamcorper sit amet. Quam pellentesque nec nam aliquam sem. Tortor at risus viverra adipiscing at in tellus integer. Augue ut lectus arcu bibendum at. Lacus sed viverra tellus in hac habitasse platea. Ipsum nunc aliquet bibendum enim facilisis. Id eu nisl nunc mi ipsum faucibus. Sed egestas egestas fringilla phasellus faucibus scelerisque eleifend donec. Ornare arcu dui vivamus arcu felis bibendum ut. Potenti nullam ac tortor vitae purus. Tincidunt dui ut ornare lectus sit.
                  <br />Blandit cursus risus at ultrices mi. Ante metus dictum at tempor commodo ullamcorper. Ac tortor dignissim convallis aenean et tortor. Elementum pulvinar etiam non quam lacus suspendisse faucibus. Blandit libero volutpat sed cras. Fusce ut placerat orci nulla. Aliquet nec ullamcorper sit amet risus nullam eget felis. Quam viverra orci sagittis eu. Eu facilisis sed odio morbi quis commodo. Suspendisse potenti nullam ac tortor vitae. Sit amet justo donec enim. Faucibus a pellentesque sit amet porttitor eget dolor morbi. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et ligula. Mauris augue neque gravida in fermentum et. Lobortis feugiat vivamus at augue. Sed viverra ipsum nunc aliquet. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Dolor sed viverra ipsum nunc aliquet.`;
</script>

<docs lang="md">
[Документация](./bottom-sheet.story.md)
</docs>
