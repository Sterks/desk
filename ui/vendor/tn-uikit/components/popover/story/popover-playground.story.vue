<template>
  <Story title="TNPopover/Playground" group="other" :layout="{ type: 'grid', width: '90%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.text" title="text" field-type="string" desc="Текст внутри TNPopover" />
      <ControlFieldText v-model="state.wrapperCustomClass" title="wrapperCustomClass" field-type="string" desc="Кастомный класс для wrapper-элемента" />
      <ControlFieldText v-model="state.width" title="width" field-type="string" default-value="200px" desc="Ширина контейнера TNPopover" />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="ITNPopoverPosition"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента"
      />
      <ControlFieldBoolean v-model="state.arrow" title="arrow" field-type="Boolean" desc="Включить/отключить стрелку рядом с компонентом" />
      <ControlFieldText v-model="state.arrowPosition" title="arrowPosition" field-type="ITNPopoverArrowPosition" desc="Позиционирование стрелки" />
      <ControlFieldUnavailable
        title="offset"
        field-type="number | { crossAxis?: number; mainAxis?: number }"
        default-value="{ crossAxis: 0, mainAxis: 8 }"
        desc="Настроить отступ всплывающего окна относительно триггер-элемента"
      />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="IPopoverOptions" desc="Опции для всплывающего окна" />
      <ControlFieldSelect
        v-model="state.trigger"
        title="trigger"
        :options="['default', 'hover']"
        field-type='"default" | "hover"'
        default-value="default"
        desc="Режим отображения TNPopover"
      />
      <ControlFieldText v-model="state.transition" title="transition" field-type="string" default-value="tn-fade" desc="Название используемой анимации" />
      <ControlFieldBoolean v-model="state.darkTheme" title="darkTheme" field-type="Boolean" desc="Включить/отключить стили темной темы для компонента" />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="Boolean"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места"
        default-value="true"
      />
      <ControlFieldBoolean v-model="state.visible" title="visible" field-type="Boolean" desc="Управление видимостью TNPopover" />
      <ControlFieldBoolean
        v-model="state.inline"
        title="inline"
        field-type="Boolean"
        default-value="true"
        desc="Добавить/убрать `display: inline-block` для элемента-обертки"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="Boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldBoolean
        v-model="state.windowStyled"
        title="windowStyled"
        field-type="Boolean"
        default-value="true"
        desc="Добавить класс `tn-popover__wrapper-inner` контейнеру контента"
      />
      <ControlFieldBoolean
        v-model="state.floating"
        title="floating"
        field-type="Boolean"
        default-value="true"
        desc="Добавление функционала плавающего компонента"
      />
      <ControlFieldBoolean v-model="state.disabledWidth" title="disabledWidth" field-type="Boolean" desc="Отключение расчета ширины в inline-стиле" />
    </template>
    <Variant id="default" title="Отображение по клику" :init-state="() => ({ trigger: 'default' })" auto-props-disabled>
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
    <Variant title="Отображение по наведению" :init-state="() => ({ trigger: 'hover' })" auto-props-disabled>
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
    <Variant
      id="arrow-position"
      title="Отображение стрелки"
      :init-state="
        () => ({
          trigger: 'hover',
          arrow: true,
          arrowPosition: 'top-left'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
    <Variant
      id="options"
      title="Управление параметрами отображения контента"
      :init-state="
        () => ({
          trigger: 'hover',
          position: 'top-right',
          offset: {
            mainAxis: 44,
            crossAxis: 20
          },
          popperOptions: {
            strategy: 'fixed'
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
    <Variant
      id="appearance"
      title="Управление внешним видом"
      :init-state="
        () => ({
          trigger: 'hover',
          text: 'Произвольный текст внутри элемента',
          width: '300px',
          transition: 'my-custom-transition',
          darkTheme: true,
          disabledWidth: true
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
    <Variant
      id="emits"
      title="Обработка событий контента"
      :init-state="
        () => ({
          trigger: 'default',
          popperOptions: {
            whileElementsMounted: () => {
              console.log('Событие отработало');
            }
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNPopover v-bind="filterState(state)">
          <template #trigger><TNIcon name="help" @click="state.trigger === 'default' ? (state.visible = !state.visible) : ''" /></template>
          <template #content> {{ state.text || "Контент" }} </template>
        </TNPopover>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import { filterState } from "../../../consts/consts";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
</script>

<docs lang="md">
[Документация](./popover.story.md)
</docs>
