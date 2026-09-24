<template>
  <Story title="TNSearch/Мобильное отображение" group="form" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldJson v-model="state.styles" title="styles" field-type="Record<string, string>" desc="Стили для DOM-элемента input" />
      <ControlFieldSelect v-model="state.size" title="size" field-type="s | m" default-value="m" desc="Размер компонента" :options="['s', 'm']" />
      <ControlFieldText
        v-model="state.searchHint"
        title="searchHint"
        field-type="string"
        default-value="Введите 3 символа, чтобы начать поиск"
        desc="Подсказка при пустом инпуте и фокусе на нём"
      />
      <ControlFieldBoolean v-model="state.nothingFoundBadge" title="nothingFoundBadge" field-type="boolean" desc="Отображать компонент пустого списка" />
      <ControlFieldText
        v-model="state.nothingFoundTitle"
        title="nothingFoundTitle"
        field-type="string"
        default-value=""
        desc="Заголовок при отсутствии результата после поиска"
      />
      <ControlFieldText
        v-model="state.nothingFoundDescription"
        title="nothingFoundDescription"
        field-type="string"
        default-value=""
        desc="Описание при отсутствии результата после поиска"
      />
      <ControlFieldText v-model="state.placeholder" title="placeholder" field-type="string" default-value="" desc="Плейсхолдер" />
      <ControlFieldText v-model="state.inputClass" title="inputClass" field-type="string" default-value="" desc="Добавляет кастомные классы к тегу input" />
      <ControlFieldBoolean v-model="state.showResult" title="showResult" field-type="boolean" default-value="false" desc="Отображение выпадающего окна" />
      <ControlFieldJson
        v-model="state.result"
        title="result"
        field-type="ITNSearchResult"
        default-value="null"
        desc="Данные для отображения поля результатов"
      />
      <ControlFieldNumber
        v-model="state.resultMaxHeight"
        title="resultMaxHeight"
        field-type="string | number"
        default-value="360"
        desc="Максимальная высота контейнера результатов"
      />
      <ControlFieldBoolean v-model="state.loading" title="loading" field-type="boolean" default-value="false" desc="Отображение статуса загрузки" />
      <ControlFieldBoolean
        v-model="state.cell"
        title="cell"
        field-type="boolean"
        default-value="false"
        desc="Режим отображения результата в формате компонента TNCell"
      />
      <ControlFieldSelect
        v-model="state.rightButtonIcon"
        title="rightButtonIcon"
        :options="iconNamesArray"
        field-type="IconNames"
        desc="Название иконки для отображения кнопки в правой части инпута"
      />
      <ControlFieldText
        v-model="state.cancelButton"
        title="cancelButton"
        field-type="string"
        default-value=""
        desc="Текст кнопки для отображения кнопки отмены справа от инпута"
      />
      <ControlFieldBoolean
        v-model="state.mobileSearchBottomSheet"
        title="mobileSearchBottomSheet"
        field-type="boolean"
        default-value="false"
        desc="Отображение для мобильного адаптива окна поиска в боттом-щите"
      />
      <ControlFieldBoolean
        v-model="state.isMobileMiniApp"
        title="isMobileMiniApp"
        field-type="boolean"
        default-value="false"
        desc="Параметр is-mobile-mini-app для боттом-щита"
      />
      <ControlFieldJson
        v-model="state.bottomSheetHeader"
        title="bottomSheetHeader"
        field-type="{ title?: string; description?: string }"
        default-value="{}"
        desc="Заголовок и описание боттом-щита"
      />
      <ControlFieldText
        v-model="state.bottomSheetCustomClass"
        title="bottomSheetCustomClass"
        field-type="string"
        default-value=""
        desc="Кастомный класс для боттом-щита"
      />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Отключение компонента" />
      <ControlFieldJson
        v-model="state.showGroupTitles"
        title="showGroupTitles"
        field-type="Record<string, boolean>"
        default-value="{}"
        desc="Заголовки групп результатов поиска"
      />
      <ControlFieldText
        v-model="state.groupTitleButton"
        title="groupTitleButton"
        field-type="string"
        desc="Текст кнопки в заголовке группы результатов поиска"
      />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента"
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места."
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="IPopoverOptions" desc="Опции для всплывающего окна" />
      <ControlFieldText
        v-model="state.maskTemplate"
        title="maskTemplate"
        field-type="string"
        desc="Шаблон маскирования вводимого текста (см. документацию, пример маски телефона: #-###-###-##-##)"
      />
      <ControlFieldText v-model="state.maskTokens" title="maskTokens" field-type="MaskTokens" desc="Собственные токены для шаблона маскирования" />
      <ControlFieldBoolean
        v-model="state.select"
        title="select"
        field-type="boolean"
        desc="Включение возможности выбора результата поиска клавиатурой (при пустом списке результатов возникнет ошибка)"
      />
      <ControlFieldText v-model="state.autocomplete" title="autocomplete" field-type="string" desc="Настройка поведения автозаполнения инпута" />
      <ControlFieldBoolean
        v-model="state.disabledPopoverWidth"
        title="disabledPopoverWidth"
        field-type="boolean"
        desc="Выключить автоматический просчет ширины для TNPopover"
      />
    </template>
    <Variant
      id="mobile"
      title="Отображение на мобильных устройствах"
      :init-state="
        () => ({
          modelValue: '',
          mobileSearchBottomSheet: true
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNSearch
          v-model="state.modelValue"
          v-bind="filterState(state)"
          @update:model-value="(searchUpdateHandler(state), logEvent('update:modelValue', { $event }))"
          @focus="((state.showResult = true), logEvent('focus', { $event }))"
          @blur="((state.showResult = false), logEvent('blur', { $event }))"
          @click:outside="((state.showResult = false), logEvent('click:outside', { $event }))"
          @enter="logEvent('enter', { $event })"
          @select="logEvent('select', { $event })"
          @window:open="((state.showResult = true), logEvent('window:open', { $event }), (isOpened = true))"
          @window:close="((state.showResult = false), logEvent('window:close', { $event }), (isOpened = false))"
          @click:cancel-button="logEvent('click:cancelButton', { $event })"
          @click:group-title="logEvent('click:groupTitle', { $event })"
          @click:right-button="logEvent('click:rightButton', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import { filterState, iconNamesArray } from "../../../consts/consts";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import { logEvent } from "histoire/client";
import { ref } from "vue";

const isOpened = ref(false);

const searchUpdateHandler = state => {
  state.loading = true;
  if (state.modelValue !== "") {
    setTimeout(() => {
      if (!state?.cell) {
        state.result = [
          {
            title: "Результат 1",
            id: "value1"
          },
          {
            title: "Результат 2",
            id: "value2"
          },
          {
            title: "Результат 3",
            id: "value3"
          }
        ];
      } else {
        state.result = [
          {
            title: "Result 1",
            subtitle: "Subtitle 1",
            id: "value1",
            userPicture: {
              text: "Р1"
            }
          },
          {
            title: "Result 1",
            subtitle: "Subtitle 1",
            id: "value2",
            userPicture: {
              text: "Р1"
            }
          },
          {
            title: "Result 1",
            subtitle: "Subtitle 1",
            id: "value3",
            userPicture: {
              text: "Р1"
            }
          }
        ];
      }
      state.loading = false;
    }, 1000);
  } else {
    state.result = null;
    state.loading = false;
  }
};
</script>

<style>
.custom-input-class {
  background-color: aquamarine;
}

.__histoire-render-story:not(.__histoire-render-custom-controls) {
  overflow: unset;
}
</style>

<docs lang="md">
## Мобильное отображение

С помощью параметра `mobileSearchBottomSheet` задаётся отображение поиска для
мобильного адаптива (точка перехода в мобильный вид настраивается глобально через
опцию плагина библиотеки `useLibraryOptions`)
в `Bottom Sheet`. В этом режиме отображения основные события для отображения и
скрытия окна поиска переходит на `window:open` и `window:close`.

```vue
<TNSearch
  v-model="searchText"
  :result="result"
  :show-result="showTestResult"
  :loading="loading"
  placeholder="Тест поиска в боттомщите для мобилке"
  mobile-search-bottom-sheet
  :bottom-sheet-header="{
    title: 'Название параметра',
    description: 'Краткое пояснение к параметру'
  }"
  nothing-found-title="Ничего не найдено"
  @click:outside="showTestResult = false"
  @window:open="showTestResult = true"
  @window:close="showTestResult = false"
  @select="selectHandler"
  @update:modelValue="searchUpdateHandler"
/>
```
</docs>
