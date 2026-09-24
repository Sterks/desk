---
title: TNSelector/Doc
group: form
---

# TNSelector

## Описание

Представляет собой селектор с выпадащим списком

## Использование

**Использование и вид можно посмотреть в [Playground](./select-playground.story.vue)**

Для использования обязательно нужно передать значения для параметров `modelValue`, `options` для отображения выбранных опций и списка опций соответственно.

**[Посмотреть в Playground](./select-playground.story.vue?variantId=main)**

```ts
const selectedOption = ref<string | number>("firstOptionID");
const selectorOptions = ref<TNTreeProps.Option[]>([
  {
    id: "firstOptionID",
    title: "Опция #1",
    isCheck: false,
    deep: 0
  },
  {
    id: "secondOptionID",
    title: "Опция #2",
    isCheck: false,
    deep: 0
  },
  {
    id: "thirdOptionID",
    title: "Опция #3",
    isCheck: false,
    deep: 0
  }
]);
```

```vue
<TNSelector
  :model-value="selectedOption"
  :options="selectorOptions"
  @update:modelValue="selectedOption = $event"
/>
```

### Поисковая строка

В селектор можно внедрить поисковую строку, во время поиска элементов рекомендуется включать `isLoading`

**[Посмотреть в Playground](./select-playground.story.vue?variantId=load)**

```ts
const searchQuery = ref<string>("");
const searchError = ref<string>("");
const isDataLoading = ref<boolean>(false);

const searchOptions = (): TNTreeProps.Option[] => {
  isDataLoading.value = true;
  try {
    // код поисковой функции
  } catch {
    searchError.value = "Не удалось найти";
  }
  isDataLoading.value = false;
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
  selectedOption.value = searchOptions();
};
```

```vue
<TNSelector
  :model-value="selectedOption"
  :options="selectorOptions"
  :search-query="searchQuery"
  :is-loading="isDataLoading"
  :search-error="searchError"
  searchable
  search-placeholder="Найти дополнительные опции"
  @update:modelValue="selectedOption = $event"
  @searchHandler="handleSearch"
/>
```

### TNPopover

Компонент использует **TNPopover**, некоторыми параметрами можно управлять. [Подробнее](../../popover/story/popover.story.md)

**[Посмотреть в Playground](./select-playground.story.vue?variantId=popover)**

```vue
<TNSelector
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

**[Посмотреть в Playground](./select-playground.story.vue?variantId=slot)**

```vue
<TNSelector
  :model-value="selectedOption"
  :options="selectorOptions"
  @update:modelValue="selectedOption = $event"
>
  <template #value="props">
    <div class="custom-option">
      {{ props.option.title }}
    </div>
  </template>
  <template #items="props">
    <div class="custom-option" :class="{ 'custom-option_selected': props.isSelected }">
      {{ props.option.title }}
    </div>
  </template>
</TNSelector>
```

**Остальные возможные параметры, события и слоты указаны ниже**

## Параметры (props)

| Название               | Тип                    | Обязательность                          | Комментарий                                                                                                                                                                 |
|------------------------|------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| size                   | `"s" \| "m"`           | &cross; (по-умолчанию: `"m"`)           | Размер компонента                                                                                                                                                           |
| searchError            | `string`               | &cross; (по-умолчанию: `""`)            | Текст ошибки поиска                                                                                                                                                         |
| searchable             | `boolean`              | &cross;                                 | Включение поисковой строки                                                                                                                                                  |
| searchPlaceholder      | `string`               | &cross; (по-умолчанию: `"Искать"`)      | Placeholder для поисковой строки                                                                                                                                            |
| placeholder            | `string`               | &cross; (по-умолчанию: `" "`)           | Placeholder для поля компонента                                                                                                                                             |
| disabled               | `boolean`              | &cross;                                 | Отключение компонента                                                                                                                                                       |
| clearable              | `boolean`              | &cross; (по-умолчанию: `true`)          | Функционал очистки содержимого по кнопке                                                                                                                                    |
| description            | `string`               | &cross; (по-умолчанию: `""`)            | Текст для описания компонента                                                                                                                                               |
| label                  | `string`               | &cross; (по-умолчанию: `""`)            | Текст для заголовка компонента                                                                                                                                              |
| searchQuery            | `string`               | &cross; (по-умолчанию: `""`)            | Текст из поисковой строки                                                                                                                                                   |
| options                | `TNTreeProps.Option[]` | &cross; (по-умолчанию: `[]`)            | Массив опций для селектора                                                                                                                                                  |
| modelValue             | `string \| number`     | &cross; (по-умолчанию: `undefined`)     | Значение value переменной для компонента                                                                                                                                    |
| isLoading              | `boolean`              | &cross;                                 | Состояние загрузки компонента                                                                                                                                               |
| required               | `boolean`              | &cross;                                 | Выводит звездочку после заголовка компонента - лейбла                                                                                                                       |
| error                  | `string`               | &cross;                                 | Текст ошибки (включает «error» стиль у компонента)                                                                                                                          |
| warn                   | `string`               | &cross;                                 | Текст предупреждения (включает «warning» стиль у компонента)                                                                                                                |
| success                | `string`               | &cross;                                 | Текст успеха (включает «success» стиль у компонента)                                                                                                                        |
| teleportTo             | `string`               | &cross; (по-умолчанию: `"main"`)        | Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева                                                                                                       |
| isMobileMiniApp        | `boolean`              | &cross;                                 | Передача одноименного параметра для боттом-щита                                                                                                                             |
| flat                   | `boolean`              | &cross;                                 | Отображает одноуровневый список без вложенности                                                                                                                             |
| emptyListHint          | `string`               | &cross;                                 | Подсказка для пустого списка опций выбора                                                                                                                                   |
| bottomSheetCustomClass | `string`               | &cross; (по-умолчанию: `""`)            | Кастомный класс для компонента TNBottomSheet                                                                                                                                |
| scrollSelectedIntoView | `boolean`              | &cross;                                 | Включение функционала скролла к выбранным опциям                                                                                                                            |
| position               | `Placement`            | &cross; (по-умолчанию: `"bottom-left"`) | Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента                                                                                        |
| flip                   | `boolean`              | &cross; (по-умолчанию: `true`)          | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| shift                  | `boolean`              | &cross;                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| popperOptions          | `IPopoverOptions`      | &cross;                                 | Опции для всплывающего окна (popper-элемента)                                                                                                                               |
| smoothMessage          | `boolean`              | &cross;                                 | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)                                                    |
| searchFocus            | `boolean`              | &cross;                                 | Установить фокус на поле ввода при открытии селектора (при включенном searchable)                                                                                           |

## События (emits)

| Событие           | Возвращаемые данные             | Комментарий                                         |
|-------------------|---------------------------------|-----------------------------------------------------|
| update:modelValue | modelValue (`string \| number`) | Событие вызывается при обновлении modelValue        |
| open              | -                               | Событие вызывается при открытии селектора           |
| close             | -                               | Событие вызывается при закрытии селектора           |
| searchHandler     | query (`string`)                | Событие вызывается при вводе текста в строку поиска |
| iconButtonClick   | id (`string \| number`)         | Событие вызывается при нажатии на иконку            |

## Слоты

| Слот        | Описание                                  | Scoped Slot                                                                                                             |
|-------------|-------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| header      | Слот для кастомного header'a              | –                                                                                                                       |
| label       | Слот для кастомного заголовка компонента  | –                                                                                                                       |
| description | Слот для кастомного описания компонента   | –                                                                                                                       || value       | Слот для кастомного отображения выбранного элемента | `option` - выбранная опция из селектора, тип данных: `TNTreeProps.Option`; `isSelected` - выбрана ли опция, тип данных: `Boolean` |
| items       | Слот для кастомного отображения селектора | `option` - опция из селектора, тип данных: `TNTreeProps.Option`; `isSelected` - выбрана ли опция, тип данных: `Boolean` |
| footer      | Слот для кастомного footer'a              | –                                                                                                                       |
