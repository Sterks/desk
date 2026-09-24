<template>
  <Story title="TNDropdown/Playground" group="data" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean v-model="state.isVisible" title="isVisible" field-type="boolean" default-value="false" desc="Показать выпадающее меню" />
      <ControlFieldText v-model="state.customClass" title="customClass" field-type="string" desc="Кастомный класс для Popover-элемента" />
      <ControlFieldBoolean
        v-model="state.expandByClick"
        title="expandByClick"
        field-type="boolean"
        default-value="false"
        desc="Раскрывать элементы меню при клике"
      />
      <ControlFieldBoolean
        v-model="state.collapseByClick"
        title="collapseByClick"
        field-type="boolean"
        default-value="false"
        desc="Сворачивать элементы меню при клике"
      />
      <ControlFieldJson v-model="state.options" title="options" field-type="ITNDropdownMenu[]" required desc="Массив элементов выпадающего меню" />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        desc="Указать позицию всплывающего окна меню относительно триггер-элемента"
      />
      <ControlFieldBoolean
        v-model="state.scrollableContent"
        title="scrollableContent"
        field-type="boolean"
        desc="Добавить возможность проскроллить контент при ограниченной высоте всплывающего окна"
      />
      <ControlFieldNumber
        v-model="state.maxHeight"
        title="maxHeight"
        field-type="Number"
        desc="Максимальная высота всплывающего окна меню (работает только в паре с scrollableContent)"
      />
      <ControlFieldBoolean v-model="state.nested" title="nested" field-type="boolean" desc="Добавить к wrapper'у триггер-элемента класс display: block" />
      <ControlFieldBoolean
        v-model="state.mobileLeftIcon"
        title="mobileLeftIcon"
        field-type="boolean"
        desc="Отображать иконку с левой стороны в мобильном виде"
      />
      <ControlFieldText v-model="state.bottomSheetCustomClass" title="bottomSheetCustomClass" field-type="string" desc="Кастомный класс для TNBottomSheet" />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="IPopoverOptions" desc="Опции для всплывающего окна" />
      <ControlFieldUnavailable
        title="offset"
        field-type="number | { crossAxis?: number; mainAxis?: number }"
        default-value="{ mainAxis: 0, crossAxis: 0 }"
        desc="Настроить отступ всплывающего окна относительно триггер-элемента"
      />
    </template>
    <Variant id="main" title="TNDropdown" :init-state="() => ({ options: [...optionsDefault] })" auto-props-disabled>
      <template #default="{ state }">
        <div class="dropdown__wrapper">
          <TNDropdown
            class="dropdown__element"
            v-bind="filterState(state)"
            @click:outside="((state.isVisible = false), logEvent('click:outside', { $event }))"
            @select="((state.isVisible = false), logEvent('select', { $event }))"
          />
          <TNButton @click="((state.isVisible = true), logEvent('click', { $event }))"> Открыть </TNButton>
        </div>
      </template>
    </Variant>
    <Variant
      id="inside"
      title="Глубокая вложенность"
      :init-state="
        () => ({
          options: [...optionsTree],
          maxHeight: 600,
          scrollableContent: true
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="dropdown__wrapper">
          <TNDropdown
            class="dropdown__element"
            v-bind="filterState(state)"
            @click:outside="((state.isVisible = false), logEvent('click:outside', { $event }))"
            @select="((state.isVisible = false), logEvent('select', { $event }))"
          />
          <TNButton @click="((state.isVisible = true), logEvent('click', { $event }))"> Открыть </TNButton>
        </div>
      </template>
    </Variant>
    <Variant
      id="custom"
      title="Передача кастомного класса в TNBottomSheet"
      :init-state="
        () => ({
          options: [...optionsDefault],
          bottomSheetCustomClass: 'bottomsheet-custom-class'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="dropdown__wrapper">
          <TNDropdown class="dropdown__element" v-bind="filterState(state)" @click:outside="state.isVisible = false" @select="state.isVisible = false" />
          <TNButton @click="state.isVisible = true"> Открыть </TNButton>
        </div>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { ITNDropdownMenu } from "../dropdown.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { filterState } from "../../../consts/consts";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import { logEvent } from "histoire/client";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";

const optionsDefault: ITNDropdownMenu[] = [
  { id: "option1", title: "Option 1", icon: "settings" },
  { id: "option2", title: "Option 2", icon: "download-light" },
  { id: "option3", title: "Option 3", icon: "home-light", disabled: true },
  {
    id: "option4",
    title: "Option 4",
    icon: "location",
    subtitle: "subtitle"
  }
];

const optionsTree = ref<ITNDropdownMenu[]>([
  {
    title: "1",
    id: "1",
    icon: "edit-2",
    childList: [
      {
        title: "1.1",
        id: "1.1",
        icon: "edit-2",
        childList: [
          {
            title: "1.1",
            id: "1.1",
            icon: "edit-2"
          },
          {
            title: "1.2",
            id: "1.2",
            icon: "edit-2"
          },
          {
            title: "1.3",
            id: "1.3",
            icon: "edit-2"
          },
          {
            title: "1.4",
            id: "1.4",
            icon: "edit-2"
          },
          {
            title: "1.5",
            id: "1.5",
            icon: "edit-2",
            childList: [
              {
                title: "1.1",
                id: "1.1",
                icon: "edit-2"
              },
              {
                title: "1.2",
                id: "1.2",
                icon: "edit-2"
              },
              {
                title: "1.3",
                id: "1.3",
                icon: "edit-2"
              },
              {
                title: "1.4",
                id: "1.4",
                icon: "edit-2"
              },
              {
                title: "1.5",
                id: "1.5",
                icon: "edit-2",
                childList: [
                  {
                    title: "1.1",
                    id: "1.1",
                    icon: "edit-2"
                  },
                  {
                    title: "1.2",
                    id: "1.2",
                    icon: "edit-2"
                  },
                  {
                    title: "1.3",
                    id: "1.3",
                    icon: "edit-2"
                  },
                  {
                    title: "1.4",
                    id: "1.4",
                    icon: "edit-2"
                  },
                  {
                    title: "1.5",
                    id: "1.5",
                    icon: "edit-2",
                    childList: [
                      {
                        title: "1.1",
                        id: "1.1",
                        icon: "edit-2"
                      },
                      {
                        title: "1.2",
                        id: "1.2",
                        icon: "edit-2"
                      },
                      {
                        title: "1.3",
                        id: "1.3",
                        icon: "edit-2"
                      },
                      {
                        title: "1.4",
                        id: "1.4",
                        icon: "edit-2"
                      },
                      {
                        title: "1.5",
                        id: "1.5",
                        icon: "edit-2",
                        childList: [
                          {
                            title: "1.1",
                            id: "1.1",
                            icon: "edit-2"
                          },
                          {
                            title: "1.2",
                            id: "1.2",
                            icon: "edit-2"
                          },
                          {
                            title: "1.3",
                            id: "1.3",
                            icon: "edit-2"
                          },
                          {
                            title: "1.4",
                            id: "1.4",
                            icon: "edit-2"
                          },
                          {
                            title: "1.5",
                            id: "1.5",
                            icon: "edit-2",
                            childList: [
                              {
                                title: "1.1",
                                id: "1.1",
                                icon: "edit-2"
                              },
                              {
                                title: "1.2",
                                id: "1.2",
                                icon: "edit-2"
                              },
                              {
                                title: "1.3",
                                id: "1.3",
                                icon: "edit-2"
                              },
                              {
                                title: "1.4",
                                id: "1.4",
                                icon: "edit-2"
                              },
                              {
                                title: "1.5",
                                id: "1.5",
                                icon: "edit-2",
                                childList: [
                                  {
                                    title: "1.1",
                                    id: "1.1",
                                    icon: "edit-2"
                                  },
                                  {
                                    title: "1.2",
                                    id: "1.2",
                                    icon: "edit-2"
                                  },
                                  {
                                    title: "1.3",
                                    id: "1.3",
                                    icon: "edit-2"
                                  },
                                  {
                                    title: "1.4",
                                    id: "1.4",
                                    icon: "edit-2"
                                  },
                                  {
                                    title: "1.5",
                                    id: "1.5",
                                    icon: "edit-2"
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "1.2",
        id: "1.2",
        icon: "edit-2"
      },
      {
        title: "1.3",
        id: "1.3",
        icon: "edit-2"
      },
      {
        title: "1.4",
        id: "1.4",
        icon: "edit-2"
      },
      {
        title: "1.5",
        id: "1.5",
        icon: "edit-2"
      }
    ]
  },
  {
    title: "2",
    id: "2",
    icon: "edit-2"
  },
  {
    title: "3",
    id: "3",
    icon: "edit-2"
  },
  {
    title: "4",
    id: "4",
    icon: "edit-2"
  },
  {
    title: "5",
    id: "5",
    icon: "edit-2"
  },
  {
    title: "6",
    id: "6",
    icon: "edit-2",
    childList: [
      {
        title: "1.1",
        id: "1.1",
        icon: "edit-2"
      },
      {
        title: "1.2",
        id: "1.2",
        icon: "edit-2"
      },
      {
        title: "1.3",
        id: "1.3",
        icon: "edit-2"
      },
      {
        title: "1.4",
        id: "1.4",
        icon: "edit-2"
      },
      {
        title: "1.5",
        id: "1.5",
        icon: "edit-2"
      },
      {
        title: "1.6",
        id: "1.6",
        icon: "edit-2",
        childList: [
          {
            title: "1.0",
            id: "1.0",
            icon: "edit-2"
          },
          {
            title: "1.1",
            id: "1.1",
            icon: "edit-2"
          },
          {
            title: "1.2",
            id: "1.2",
            icon: "edit-2"
          },
          {
            title: "1.3",
            id: "1.3",
            icon: "edit-2"
          },
          {
            title: "1.4",
            id: "1.4",
            icon: "edit-2"
          },
          {
            title: "1.5",
            id: "1.5",
            icon: "edit-2"
          },
          {
            title: "1.6",
            id: "1.6",
            icon: "edit-2"
          },
          {
            title: "1.7",
            id: "1.7",
            icon: "edit-2"
          },
          {
            title: "1.8",
            id: "1.8",
            icon: "edit-2"
          },
          {
            title: "1.9",
            id: "1.9",
            icon: "edit-2"
          },
          {
            title: "1.10",
            id: "1.10",
            icon: "edit-2"
          },
          {
            title: "1.11",
            id: "1.11",
            icon: "edit-2",
            disabled: true
          },
          {
            title: "1.12",
            id: "1.12",
            icon: "edit-2"
          },
          {
            title: "1.13",
            id: "1.13",
            userPicture: {
              icon: "star"
            },
            icon: "edit-2"
          },
          {
            title: "1.14",
            id: "1.14",
            icon: "edit-2",
            subtitle: "asdajshdgjhsa gdjag jdasg jdagsjd gasjhd gajhsd gashjdg asjhdga sjhdg aasjsashjg djahsg dhajsgd ja  djasgdjasgdg"
          },
          {
            title: "1.15",
            id: "1.15",
            icon: "edit-2",
            subtitle: "asdajshdgjhsa gdjag jdasg jdagsjd gasjhd gajhsd gashjdg asjhdga sjhdg aasjsashjg djahsg dhajsgd ja  djasgdjasgdg"
          },
          {
            title: "1.16",
            id: "1.16",
            icon: "edit-2",
            subtitle: "asdajshdgjhsa gdjag jdasg jdagsjd gasjhd gajhsd gashjdg asjhdga sjhdg aasjsashjg djahsg dhajsgd ja  djasgdjasgdg"
          },
          {
            title: "1.17",
            id: "1.17",
            icon: "edit-2",
            subtitle: "asdajshdgjhsa gdjag jdasg jdagsjd gasjhd gajhsd gashjdg asjhdga sjhdg aasjsashjg djahsg dhajsgd ja  djasgdjasgdg"
          },
          {
            title: "1.18",
            id: "1.18",
            icon: "edit-2"
          },
          {
            title: "1.19",
            id: "1.19",
            icon: "edit-2"
          },
          {
            title: "1.20",
            id: "1.20",
            icon: "edit-2"
          },
          {
            title: "1.21",
            id: "1.21",
            icon: "edit-2"
          },
          {
            title: "1.22",
            id: "1.22",
            icon: "edit-2"
          },
          {
            title: "1.23",
            id: "1.23",
            icon: "edit-2"
          },
          {
            title: "1.24",
            id: "1.24",
            icon: "edit-2"
          },
          {
            title: "1.25",
            id: "1.25",
            icon: "edit-2"
          },
          {
            title: "1.26",
            id: "1.26",
            icon: "edit-2"
          },
          {
            title: "1.27",
            id: "1.27",
            icon: "edit-2"
          },
          {
            title: "1.28",
            id: "1.28",
            icon: "edit-2"
          },
          {
            title: "1.29",
            id: "1.29",
            icon: "edit-2"
          },
          {
            title: "1.30",
            id: "1.30",
            icon: "edit-2"
          },
          {
            title: "1.31",
            id: "1.31",
            icon: "edit-2"
          },
          {
            title: "1.32",
            id: "1.32",
            icon: "edit-2"
          },
          {
            title: "1.33",
            id: "1.33",
            icon: "edit-2"
          },
          {
            title: "1.34",
            id: "1.34",
            icon: "edit-2"
          },
          {
            title: "1.35",
            id: "1.35",
            icon: "edit-2"
          },
          {
            title: "1.36",
            id: "1.36",
            icon: "edit-2"
          },
          {
            title: "1.37",
            id: "1.37",
            icon: "edit-2"
          },
          {
            title: "1.38",
            id: "1.38",
            icon: "edit-2"
          },
          {
            title: "1.39",
            id: "1.39",
            icon: "edit-2"
          }
        ]
      }
    ]
  }
]);
</script>

<style>
.dropdown__wrapper {
  position: relative;
}

.dropdown__wrapper .tn-dropdown {
}

.dropdown__element {
  position: absolute;
  top: 100%;
  z-index: 2;
}

.__histoire-render-story:not(.__histoire-render-custom-controls) {
  overflow: unset;
}
</style>

<docs lang="md">
[Документация](./dropdown.story.md)
</docs>
