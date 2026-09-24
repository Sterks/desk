---
title: TNSelectorV2/Doc
group: form
---

# TNSelectorV2

## Описание

Селектор с одиночным выбором и выпадающим списком. Лёгкое ядро: плоский список опций, поиск (локальный или внешний), очистка значения, состояние загрузки. На desktop список открывается через `TNPopover`, на mobile — через `TNBottomSheet`.

Компонент **generic** по типу опции (`TOption`) и ключу значения (`TValueKey`): опции могут быть объектами или примитивами (`string` / `number`), а в `modelValue` по умолчанию попадает весь объект опции — либо `option[valueKey]`, если задан `valueKey`. Тип значения (`TModelValue`) выводится автоматически: `TOption[TValueKey]` при заданном `valueKey`, иначе — `TOption`.

## Использование

**Вид и поведение — в [Playground](./select_v2-playground.story.vue)**

Минимально нужно передать `v-model` и `options`. Для объектов отображаемый текст берётся из поля `labelKey` (по умолчанию `"title"`), идентификатор для сравнения — из `idKey` (по умолчанию `"id"`).

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=main)**

```ts
const city = ref();
const cities = [
  { id: 1, title: "Москва" },
  { id: 2, title: "Казань" },
  { id: 3, title: "Сочи", disabled: true } // опцию с `disabled: true` нельзя выбрать
];
```

```vue
<TNSelectV2 v-model="city" :options="cities" label="Город" placeholder="Выберите город" />
```

### Значение через `valueKey`

По умолчанию в `modelValue` уходит весь объект опции. Чтобы хранить только идентификатор — задайте `valueKey`.

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=value-key)**

```vue
<!-- modelValue будет числом (option.id), а не объектом -->
<TNSelectV2 v-model="cityId" :options="cities" value-key="id" />
```

> Тип `modelValue` выводится из `valueKey` автоматически: при `value-key="id"` модель имеет тип `option.id` (например, `number`). `valueKey` можно указать только на примитивное поле опции (`string` / `number`).

### Простой массив строк

Опции могут быть примитивами — тогда строка/число сама является и текстом, и значением; `labelKey` / `valueKey` / `idKey` для них игнорируются.

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=string-options)**

```vue
<TNSelectV2 v-model="city" :options="['Москва', 'Казань', 'Сочи']" />
```

### Локальный поиск

Включается `searchable`. По умолчанию `localFilter: true` — компонент сам фильтрует `options` по `labelKey`.

```vue
<TNSelectV2 v-model="city" :options="cities" searchable search-placeholder="Искать город" />
```

### Внешний (серверный) поиск

Отключите `localFilter`, чтобы компонент не фильтровал список сам, а только эмитил `search:update`. Наполнением `options` управляет родитель; на время запроса включайте `isLoading`. Дебаунс — на стороне потребителя.

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=external-search)**

```ts
const options = ref<Option[]>([]);
const loading = ref(false);

const handleSearch = async (query: string) => {
  if (query.trim().length < 2) {
    options.value = [];
    return;
  }
  loading.value = true;
  options.value = await fetchCities(query); // запрос на бек
  loading.value = false;
};
```

```vue
<TNSelectV2
  v-model="city"
  :options="options"
  :is-loading="loading"
  :local-filter="false"
  searchable
  empty-list-hint="Ничего не найдено"
  @search:update="handleSearch"
/>
```

### Использование слотов

Слот `value` — кастомное отображение выбранного значения в поле; слот `option` — кастомное отображение опции в списке. Оба передают `props` для отрисовки.

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=slots)**

```vue
<TNSelectV2 v-model="city" :options="cities">
  <template #value="{ option }">
    <strong>★ {{ option?.title }}</strong>
  </template>
  <template #option="{ option, isSelected }">
    {{ option.title }}
    <span v-if="isSelected">✓</span>
  </template>
</TNSelectV2>
```

### Управление через ref

Через template ref доступен публичный API компонента: открыть/закрыть список, подскроллить к контролу (например, к первому невалидному полю формы), сбросить строку поиска. Компонент generic, поэтому `InstanceType` для ref не подходит — типизируйте ref интерфейсом `TNSelectV2Expose`.

**[Посмотреть в Playground](./select_v2-playground.story.vue?variantId=expose)**

```ts
import type { TNSelectV2Expose } from "@life_uikit/uikit";

const citySelect = ref<TNSelectV2Expose | null>(null);

const onSubmitFailed = () => {
  citySelect.value?.el?.scrollIntoView({ block: "center" });
};
```

```vue
<TNSelectV2 ref="citySelect" v-model="city" :options="cities" :error="errors.city" />
```

**Остальные параметры, события, методы и слоты — ниже.**

## Параметры (props)

| Название               | Тип                  | Обязательность                          | Комментарий                                                                                   |
|------------------------|----------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------|
| modelValue             | `TModelValue`        | &cross; (по-умолчанию: `undefined`)     | Значение компонента: объект опции либо `option[valueKey]`, если задан `valueKey`              |
| options                | `TOption[]`          | &cross; (по-умолчанию: `[]`)            | Массив опций для выбора (объекты или примитивы)                                                |
| labelKey               | `PrimitiveKeys<TOption>` | &cross; (по-умолчанию: `"title"`)   | Примитивное поле опции для отображаемого текста                                                |
| valueKey               | `TValueKey`          | &cross;                                 | Примитивное поле опции, значение которого попадает в `modelValue`. Без него — весь объект опции |
| idKey                  | `PrimitiveKeys<TOption>` | &cross; (по-умолчанию: `"id"`)      | Примитивное поле опции для уникального идентификатора (сравнение, `:key`)                      |
| placeholder            | `string`             | &cross; (по-умолчанию: `""`)            | Текст-заглушка, когда ничего не выбрано                                                        |
| disabled               | `boolean`            | &cross;                                 | Отключение компонента                                                                          |
| clearable              | `boolean`            | &cross; (по-умолчанию: `true`)          | Кнопка очистки выбранного значения                                                             |
| size                   | `"s" \| "m"`         | &cross; (по-умолчанию: `"m"`)           | Размер компонента                                                                              |
| searchable             | `boolean`            | &cross;                                 | Включение поисковой строки                                                                     |
| searchQuery            | `string`             | &cross; (по-умолчанию: `""`)            | Контролируемое значение поисковой строки                                                       |
| searchPlaceholder      | `string`             | &cross; (по-умолчанию: `"Искать"`)      | Placeholder поисковой строки                                                                   |
| searchFocus            | `boolean`            | &cross; (по-умолчанию: `true`)          | Установить фокус на поиск при открытии (при `searchable`)                                      |
| localFilter            | `boolean`            | &cross; (по-умолчанию: `true`)          | Фильтровать опции по `labelKey` внутри компонента. Отключите для серверного поиска             |
| isLoading              | `boolean`            | &cross;                                 | Состояние загрузки списка                                                                      |
| emptyListHint          | `string`             | &cross;                                 | Подсказка для пустого списка опций                                                             |
| notFoundHint           | `string`             | &cross; (по-умолчанию: `"Ничего не найдено"`) | Подсказка, когда по поисковому запросу ничего не найдено (работает и при серверном поиске) |
| position               | `ITNPopoverPosition` | &cross; (по-умолчанию: `"bottom-left"`) | Позиционирование выпадающего окна относительно триггера                                        |
| flip                   | `boolean`            | &cross; (по-умолчанию: `true`)          | Отображать окно с другой стороны, если не хватает места                                        |
| shift                  | `boolean`            | &cross; (по-умолчанию: `true`)          | Сдвигать окно, чтобы оно не выходило за пределы экрана                                         |
| popperOptions          | `IPopoverOptions`    | &cross;                                 | Опции для выпадающего окна                                                                     |
| mobileBreakPoint       | `number`             | &cross;                                 | Точка перехода в мобильный вид (px)                                                            |
| teleportTo             | `string`             | &cross; (по-умолчанию: `"main"`)        | Контейнер для teleport (используется bottom-sheet)                                             |
| isMobileMiniApp        | `boolean`            | &cross;                                 | Параметр `is-mobile-mini-app` для bottom-sheet                                                 |
| bottomSheetCustomClass | `string`             | &cross; (по-умолчанию: `""`)            | Кастомный класс для bottom-sheet                                                               |
| label                  | `string`             | &cross;                                 | Текст заголовка компонента                                                                     |
| description            | `string`             | &cross;                                 | Текст описания компонента                                                                      |
| required               | `boolean`            | &cross;                                 | Выводит звездочку после заголовка                                                              |
| error                  | `string`             | &cross;                                 | Текст ошибки (включает «error» стиль)                                                          |
| warn                   | `string`             | &cross;                                 | Текст предупреждения (включает «warning» стиль)                                                |
| success                | `string`             | &cross;                                 | Текст успеха (включает «success» стиль)                                                        |
| smoothMessage          | `boolean`            | &cross;                                 | Плавная анимация появления текста ошибки/предупреждения/успеха                                 |

## События (emits)

| Событие           | Возвращаемые данные      | Комментарий                                       |
|-------------------|--------------------------|---------------------------------------------------|
| update:modelValue | value (`TModelValue`)    | Вызывается при выборе опции или очистке значения  |
| select:open       | –                        | Вызывается при открытии селектора                 |
| select:close      | –                        | Вызывается при закрытии селектора                 |
| search:update     | query (`string`)         | Вызывается при вводе текста в строку поиска        |

## Методы и свойства (expose)

Доступны через template ref, тип — `TNSelectV2Expose`.

| Имя         | Тип                   | Комментарий                                                                          |
|-------------|-----------------------|--------------------------------------------------------------------------------------|
| isOpen      | `boolean` (readonly)  | Открыт ли выпадающий список                                                          |
| el          | `HTMLElement \| null` | Корневой элемент контрола (без лейбла и описания) — для `scrollIntoView` и замеров   |
| open        | `() => void`          | Открыть список. Учитывает `disabled`                                                 |
| close       | `() => void`          | Закрыть список                                                                       |
| toggle      | `() => void`          | Переключить состояние списка                                                         |
| clearSearch | `() => void`          | Сбросить строку поиска; эмитит `search:update` с пустой строкой                      |

## Слоты

| Слот        | Описание                                            | Scoped Slot                                                                                          |
|-------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------------|
| value       | Кастомное отображение выбранного значения в поле     | `option` — выбранная опция (`TOption \| null`); `value` — текущее `modelValue` (`TModelValue`)        |
| option      | Кастомное отображение опции в списке                 | `option` — опция (`TOption`); `isSelected` — выбрана ли опция (`boolean`)                             |
| header      | Кастомный header над полем                           | –                                                                                                    |
| label       | Кастомный заголовок компонента                       | –                                                                                                    |
| description | Кастомное описание компонента                        | –                                                                                                    |
| footer      | Кастомный footer                                     | –                                                                                                    |
