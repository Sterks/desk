---
title: TNScrollSelect/Doc
group: form
---

# TNScrollSelect

## Описание

Представляет собой расширенную версию компонента **TNMultiSelect**.  
Основные изменения - вертикальный скролл, настройка максимальной высоты компонента, более гибкое управление данными (чипсами, селектором)

## Использование

Для использования обязательно нужно передать значения для параметров `modelValue`, `options` для отображения выбранных опций и списка опций соответственно.

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=main)**

```ts
const selectedOption = ref<(string | number)[]>(["firstOptionID"]);
const selectorOptions = ref<TNScrollSelectOption[]>([
  {
    id: "firstOptionID",
    title: "Опция #1"
  },
  {
    id: "secondOptionID",
    title: "Опция #2"
  },
  {
    id: "thirdOptionID",
    title: "Опция #3"
  }
]);
```

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  @update:modelValue="selectedOption = $event"
/>
```

### Поисковая строка

В селектор можно внедрить поисковую строку, во время поиска элементов рекомендуется включать `isLoading`

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=search)**

```ts
const searchQuery = ref<string>("");
const isDataLoading = ref<boolean>(false);

const searchOptions = (): TNScrollSelectOption[] => {
  isDataLoading.value = true;
  // код поисковой функции
  isDataLoading.value = false;
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
  selectedOption.value = searchOptions();
};
```

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  :search-query="searchQuery"
  :is-loading="isDataLoading"
  searchable
  search-placeholder="Найти дополнительные опции"
  @update:modelValue="selectedOption = $event"
  @searchHandler="handleSearch"
/>
```

### Высота компонента

По мере выбора опций компонент может расти. Для установки максимальной высоты используется параметр `maxHeight`

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=height)**

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  max-height="120"
  @update:modelValue="selectedOption = $event"
  @searchHandler="handleSearch"
/>
```

### Удаление чипса

Для включения возможности удалить выбранную опцию (чипс) из списка выбранных опций необоходимо включить параметр `deletableChips`  
(не работает при использовании слота)

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=delete)**

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  deletable-chips
  @update:modelValue="selectedOption = $event"
  @searchHandler="handleSearch"
/>
```

### Информативные параметры

Можно менять такие дополнительные параметры, как плейсхолдер, лейбл, размер компонента, возможность очистки выбранного по кнопке, подсказка при пустом списке опций, тексты ошибки/предупреждения/успеха, добавление красного индикатора-звездочки, отключение компонента

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  :disabled="isDisabled"
  size="s"
  required
  clearable
  label="Заголовок для выбора опций"
  placeholder="Нажмите для выбора"
  empty-list-hint="Список опций пуст"
  success="Текст успеха"
  error="Текст ошибки"
  warn="Текст предупреждения"
  @update:modelValue="selectedOption = $event"
/>
```

### TNPopover

Компонент использует **TNPopover**, некоторыми параметрами можно управлять. [Подробнее](../../popover/story/popover.story.md)

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=popover)**

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  position="right"
  flip
  shift
  :popper-options="{
    strategy: 'fixed'
  }"
  @update:modelValue="selectedOption = $event"
/>
```

### Использование слотов

В компоненте предусмотрена возможность создания собственного вида опций, для этого нужно воспользоваться слотами  
Для изменения вида выбранных опций - слот `value`, для списка опций - `items`
Слоты передают `props`, которые можно использовать при отрисовке

**[Посмотреть в Playground](./scroll-select-playground.story.vue?variantId=slot)**

```ts
const foundOption = (id: string | number): TNScrollSelectOption => {
  return selectorOptions.value.find(item => item.id === id);
};
```

```vue
<TNScrollSelect
  :model-value="selectedOption"
  :options="selectorOptions"
  @update:modelValue="selectedOption = $event"
>
  <template #value="id">
    <div class="custom-option">
      {{ foundOption(id) }}
    </div>
  </template>
  <template #items="props">
    <div class="custom-option" :class="{ 'custom-option_selected': props.isSelected }">
      {{ props.option.title }}
    </div>
  </template>
</TNScrollSelect>
```

**Остальные возможные параметры, события и слоты указаны ниже**

## Параметры (props)

| Название               | Тип                      | Обязательность                          | Комментарий                                                                                                                                                                 |
|------------------------|--------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| size                   | `"s" \| "m"`             | &cross; (по-умолчанию: `"m"`)           | Размер компонента                                                                                                                                                           |
| searchable             | `boolean`                | &cross;                                 | Включение поисковой строки                                                                                                                                                  |
| searchPlaceholder      | `string`                 | &cross; (по-умолчанию: `"Искать"`)      | Placeholder для поисковой строки                                                                                                                                            |
| placeholder            | `string`                 | &cross; (по-умолчанию: `" "`)           | Placeholder для поля компонента                                                                                                                                             |
| disabled               | `boolean`                | &cross; (по-умолчанию: `false`)         | Отключение компонента                                                                                                                                                       |
| clearable              | `boolean`                | &cross; (по-умолчанию: `true`)          | Функционал очистки содержимого по кнопке                                                                                                                                    |
| label                  | `string`                 | &cross; (по-умолчанию: `""`)            | Текст для заголовка компонента                                                                                                                                              |
| description            | `string`                 | &cross; (по-умолчанию: `""`)            | Текст для описания компонента                                                                                                                                               |
| searchQuery            | `string`                 | &cross; (по-умолчанию: `""`)            | Текст из поисковой строки                                                                                                                                                   |
| options                | `TNScrollSelectOption[]` | &cross; (по-умолчанию: `[]`)            | Массив опций для селектора                                                                                                                                                  |
| modelValue             | `(string \| number)[]`   | &cross; (по-умолчанию: `[]`)            | Значение value переменной для компонента                                                                                                                                    |
| isLoading              | `boolean`                | &cross; (по-умолчанию: `false`)         | Состояние загрузки компонента                                                                                                                                               |
| required               | `boolean`                | &cross; (по-умолчанию: `false`)         | Выводит звездочку после заголовка компонента - лейбла                                                                                                                       |
| error                  | `string`                 | &cross;                                 | Текст ошибки (включает «error» стиль у компонента)                                                                                                                          |
| warn                   | `string`                 | &cross;                                 | Текст предупреждения (включает «warning» стиль у компонента)                                                                                                                |
| success                | `string`                 | &cross;                                 | Текст успеха (включает «success» стиль у компонента)                                                                                                                        |
| teleportTo             | `string`                 | &cross; (по-умолчанию: `"main"`)        | Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева                                                                                                       |
| isMobileMiniApp        | `boolean`                | &cross; (по-умолчанию: `false`)         | Передача одноименного параметра для боттом-щита                                                                                                                             |
| emptyListHint          | `string`                 | &cross;                                 | Подсказка для пустого списка опций выбора                                                                                                                                   |
| bottomSheetCustomClass | `string`                 | &cross; (по-умолчанию: `""`)            | Кастомный класс для компонента TNBottomSheet                                                                                                                                |
| scrollSelectedIntoView | `boolean`                | &cross; (по-умолчанию: `false`)         | Включение функционала скролла к выбранным опциям                                                                                                                            |
| position               | `Placement`              | &cross; (по-умолчанию: `"bottom-left"`) | Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента                                                                                        |
| flip                   | `boolean`                | &cross; (по-умолчанию: `true`)          | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| shift                  | `boolean`                | &cross;                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| popperOptions          | `UseFloatingOptions`     | &cross;                                 | Опции для всплывающего окна (popper-элемента)                                                                                                                               |
| maxHeight              | `Number \| String`       | &cross; (по-умолчанию: `96`)            | Максимальная высота компонента                                                                                                                                              |
| deletableChips         | `boolean`                | &cross; (по-умолчанию: `true`)          | Опция удаления чипса (рисует крест рядом в чипсе)                                                                                                                           |
| smoothMessage          | `boolean`                | &cross;                                 | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)                                                    |
| searchFocus            | `boolean`                | &cross;                                 | Установить фокус на поле ввода при открытии селектора (при включенном `searchable`)                                                                                         |

## События (emits)

| Событие           | Возвращаемые данные                 | Комментарий                                            |
|-------------------|-------------------------------------|--------------------------------------------------------|
| update:modelValue | modelValue (`(string \| number)[]`) | Событие вызывается при обновлении modelValue           |
| open              | -                                   | Событие вызывается при открытии селектора              |
| close             | -                                   | Событие вызывается при закрытии селектора              |
| searchHandler     | query (`string`)                    | Событие вызывается при вводе текста в поисковую строку |
| iconButtonClick   | optionID (`number \| string`)       | Событие вызывается при клике на иконку                 |

## Слоты

| Слот        | Описание                                 | Scoped Slot                                                                                                              |
|-------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| header      | Слот для кастомного header'a             | –                                                                                                                        |
| label       | Слот для кастомного заголовка компонента | –                                                                                                                        |
| description | Слот для кастомного описания компонента  | –                                                                                                                        |
| value       | Слот для кастомной чипсы                 | `id` - id выбранной опции, тип данных: `string \| number`                                                                |
| items       | Слот для кастомной опции                 | `option` - опция в селекторе, тип данных: `TNScrollSelectOption`; "isSelected" - выбрана ли опция, тип данных: `Boolean` |
| footer      | Слот для кастомного footer'a             | –                                                                                                                        |

