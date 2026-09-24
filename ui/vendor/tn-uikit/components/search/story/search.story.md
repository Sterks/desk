---
title: TNSearch/Doc
group: form
---

# TNSearch

## Описание

Представляет собой компонент поисковой строки

## Использование компонента

### Размер

За задание размера отвечает параметр `size`:

- `s`
- `m`

**[Посмотреть можно в Playground](./search-styles.story.vue?variantId=small)**

```vue
<TNSearch v-model="searchText" size="s" />
```

### Стили

**[Посмотреть можно в Playground](./search-styles.story.vue?variantId=class)**

задать стили элементу input компонента можно с помощью параметров:

- `input-class` - Добавляет классы к тегу `input`
- `styles` - Добавляет стили к тегу `input`

### Подсказка

Текст подсказки при фокусе задаётся параметром `search-hint`:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=hint)**

```vue
<TNSearch
  v-model="searchText"
  :show-result="showResult"
  search-hint="Search hint text"
  @focus="showResult = true"
  @click:outside="showResult = false"
/>
```

Окно поиска отображается с помощью параметра `show-result`.

### Поиск

Параметром `result` передаётся, как правило, результат поиска под полем ввода:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=result)**

```vue
<TNSearch
  v-model="searchText"
  :show-result="showResult"
  :result="result"
  @update:modelValue="searchUpdateHandler"
  @focus="showResult = true"
  @click:outside="showResult = false"
/>
```

Статус загрузки задаётся параметром `loading`:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=loading)**

```vue
<TNSearch
  v-model="searchText"
  :show-result="showResult"
  :loading="loading"
  @focus="showResult = true"
  @click:outside="showResult = false"
/>
```

Заголовок текста при пустом списке `result` задаётся параметром
`nothingFoundTitle`:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=nothingFound)**

```vue
<TNSearch
  v-model="searchText"
  :show-result="showResult"
  :result="result"
  :loading="loading"
  nothing-found-title="Я ничего не нашёл"
  @update:modelValue="searchUpdateHandler"
  @focus="showResult = true"
  @click:outside="showResult = false"
/>
```

Так же для параметра `result` поддерживается отображение компонента `Cell` в
качестве результата путём передачи списка с типом `ICellDataItem`
и параметром `cell`:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=cell)**

```vue
<TNSearch
  v-model="searchText"
  :result="cellResult"
  :loading="loading"
  cell
  @select="selectHandler"
  @update:modelValue="searchUpdateHandler"
/>
```

### Разделение на подгруппы

Разделение на группы возможно при правильном заполнении массива для параметра `result`  
Чтобы отобразить заголовок группы в массив нужно добавить `string` значение, а для результата поиска добавить объект `{ id: string; title: string; }`  
Пример правильного массива `ITNSearchResult` для `result`

```ts
const resultArray = ref<ITNSearchResult>([
  "Заголовок группы №1",
  { id: "result_1", title: "Результат поиска 1 [Группа 1]" },
  { id: "result_2", title: "Результат поиска 2 [Группа 1]" },
  { id: "result_3", title: "Результат поиска 3 [Группа 1]" },
  "Заголовок группы №2",
  { id: "result_4", title: "Результат поиска 1 [Группа 2]" },
  { id: "result_5", title: "Результат поиска 2 [Группа 2]" }
]);
```

Также есть возможность добавить каждой группе кнопку, текст которой на всех группах одинаковый. Для этого надо написать текст для кнопки в параметр `groupTitleButton` и заполнить объект параметра `showGroupTitles`, который принимает в себя объект, ключами которого являются названия групп, а значением - `boolean`

Пример такого объекта

```ts
const showGroupButtons = ref<Record<string, boolean>>({
  "Заголовок группы №1": true,
  "Заголовок группы №2": false
});
```

В данном случае кнопка для группы "Заголовок группы №1" отобразится, а для "Заголовок группы №2" нет.  
При клике на кнопку отработает событие `click:groupTitle`, которое вернет название группы, где была нажата кнопка

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=groups)**

```vue
<TNSearch
  v-model="searchText"
  :result="resultArray"
  group-title-button="Текст в кнопке"
  :show-group-titles="showGroupButtons"
  @select="selectHandler"
  @update:modelValue="searchUpdateHandler"
  @click:groupTitle="doSomethingWithGroup($event)"
/>
```

### Кнопки

Параметрами `rightButtonIcon` и `cancelButton` задаётся отображение кнопок
справа внутри поля ввода и снаружи справа
от поля ввода. События клика по ним прослушиваются по `click:rightButton` и
`click:cancelButton` соответственно:

**[Посмотреть можно в Playground](./search-buttons.story.vue?variantId=cancel)**

```vue
<TNSearch
  v-model="searchText"
  right-button-icon="scan"
  cancel-button="Отмена"
  @click:rightButton="rightHandler"
  @click:cancelButton="cancelHandler"
/>
```

### Мобильное отображение

С помощью параметра `mobileSearchBottomSheet` задаётся отображение поиска для
мобильного адаптива (точка перехода в мобильный вид настраивается глобально через
опцию плагина библиотеки `useLibraryOptions`)
в `Bottom Sheet`. В этом режиме отображения основные события для отображения и
скрытия окна поиска переходит на `window:open` и `window:close`.

**[Посмотреть можно в Playground](./search-bottom-sheet.story.vue?variantId=mobile)**

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

### Слоты

В компоненте есть возможность отображать свои элементы выдачи с помощью слота `value`:

**[Посмотреть можно в Playground](./search-window.story.vue?variantId=slot)**

```vue
<TNSearch
  v-model="searchText"
  :result="cellResult"
  :loading="loading"
  cell
  :show-result="showResult"
  @select="selectHandler"
  @update:modelValue="searchUpdateHandler"
  @click:outside="showResult = false"
  @focus="showResult = true"
>
  <template #value>
    <p
      v-for="item in cellResult"
      :key="item.id"
      class="custom-result-item"
      @click="selectHandler(item.id)"
    >
      {{ item.title }}
    </p>
  </template>
</TNSearch>
```

## Параметры (props)

| Название                | Тип                                        | Обязательность                                                    | Комментарий                                                                                                                                                                 |
|-------------------------|--------------------------------------------|-------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| styles                  | `Record<string, string>`                   | &cross;                                                           | Стили для DOM-элемента input                                                                                                                                                |
| size                    | `"s" \| "m"`                               | &cross; (по-умолчанию: `"m"`)                                     | Размер компонента                                                                                                                                                           |
| searchHint              | `string`                                   | &cross; (по-умолчанию: `"Введите 3 символа, чтобы начать поиск"`) | Подсказка при пустом инпуте и фокусе на нём                                                                                                                                 |
| nothingFoundBadge       | `boolean`                                  | &cross;                                                           | Отображать компонент пустого списка                                                                                                                                         |
| nothingFoundTitle       | `string`                                   | &cross; (по-умолчанию: `""`)                                      | Заголовок при отсутствии результата после поиска                                                                                                                            |
| nothingFoundDescription | `string`                                   | &cross; (по-умолчанию: `""`)                                      | Описание при отсутствии результата после поиска **(работает только вместе с nothingFoundBadge)**                                                                            |
| placeholder             | `string`                                   | &cross; (по-умолчанию: `"Найти"`)                                 | Плейсхолдер                                                                                                                                                                 |
| modelValue              | `string`                                   | &cross;                                                           | Значение value переменной для компонента                                                                                                                                    |
| inputClass              | `string`                                   | &cross;                                                           | Добавляет кастомные классы к тегу input                                                                                                                                     |
| showResult              | `boolean`                                  | &cross; (по-умолчанию: `false`)                                   | Отображение выпадающего окна                                                                                                                                                |
| result                  | `ITNSearchResult`                          | &cross; (по-умолчанию: `null`)                                    | Данные для отображения поля результатов. Вид данных: "Group" - заголовок для результатов; { id, title } - один из результатов поиска                                        |
| resultMaxHeight         | `string \| number`                         | &cross; (по-умолчанию: `360`)                                     | Максимальная высота контейнера результатов                                                                                                                                  |
| loading                 | `boolean`                                  | &cross; (по-умолчанию: `false`)                                   | Отображение статуса загрузки                                                                                                                                                |
| cell                    | `boolean`                                  | &cross; (по-умолчанию: `false`)                                   | Режим отображения результата в формате компонента **TNCell**                                                                                                                |
| rightButtonIcon         | `IconNames`                                | &cross;                                                           | Название иконки для отображения кнопки в правой части инпута                                                                                                                |
| cancelButton            | `string`                                   | &cross; (по-умолчанию: `""`)                                      | Текст кнопки для отображения кнопки отмены справа от инпута                                                                                                                 |
| mobileSearchBottomSheet | `boolean`                                  | &cross; (по-умолчанию: `false`)                                   | Отображение для мобильного адаптива окна поиска в боттом-щите                                                                                                               |
| isMobileMiniApp         | `boolean`                                  | &cross; (по-умолчанию: `false`)                                   | Параметр **is-mobile-mini-app** для боттом-щита                                                                                                                             |
| bottomSheetHeader       | `{ title?: string; description?: string }` | &cross; (по-умолчанию: `{}`)                                      | Заголовок и описание боттом-щита                                                                                                                                            |
| bottomSheetCustomClass  | `string`                                   | &cross; (по-умолчанию: `""`)                                      | Кастомный класс для боттом-щита                                                                                                                                             |
| disabled                | `boolean`                                  | &cross;                                                           | Отключение компонента                                                                                                                                                       |
| groupTitleButton        | `string`                                   | &cross;                                                           | Текст кнопки в заголовке группы результатов поиска                                                                                                                          |
| showGroupTitles         | `Record<string, boolean>`                  | &cross; (по-умолчанию: `{}`)                                      | Заголовки групп результатов поиска                                                                                                                                          |
| position                | `Placement`                                | &cross; (по-умолчанию: `"bottom-left"`)                           | Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента                                                                                        |
| flip                    | `boolean`                                  | &cross; (по-умолчанию: `true`)                                    | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу |
| shift                   | `boolean`                                  | &cross;                                                           | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                          |
| popperOptions           | `IPopoverOptions`                          | &cross;                                                           | Опции для всплывающего окна (popper-элемента)                                                                                                                               |
| maskTemplate            | `string`                                   | &cross;                                                           | Шаблон маскирования вводимого текста. Формирование можно посмотреть в [документации Maska](https://beholdr.github.io/maska/v3/#/tokens)                                     |
| maskTokens              | `MaskTokens`                               | &cross;                                                           | Задание собственных токенов для шаблона маскирования                                                                                                                        |
| select                  | `boolean`                                  | &cross;                                                           | Включение возможности выбора результата поиска клавиатурой (при пустом списке результатов возникнет ошибка)                                                                 |
| autocomplete            | `string`                                   | &cross; (по-умолчанию: `off`)                                     | Настройка поведения автозаполнения инпута                                                                                                                                   |
| disabledPopoverWidth    | `boolean`                                  | &cross;                                                           | Выключить автоматический просчет ширины для **TNPopover**                                                                                                                   |

## События (emits)

| Событие            | Возвращаемые данные           | Комментарий                                                                                             |
|--------------------|-------------------------------|---------------------------------------------------------------------------------------------------------|
| update:modelValue  | modelValue (`String`)         | Событие вызывается при обновлении modelValue                                                            |
| blur               | event.target.value (`String`) | Событие вызывается при расфокусе поля ввода                                                             |
| focus              | event.target.value (`String`) | Событие вызывается при фокусе на поле ввода                                                             |
| enter              | event.target.value (`String`) | Событие вызывается при нажатии Enter                                                                    |
| click:outside      | modelValue (`String`)         | Событие вызывается при клике вне компонента                                                             |
| select             | value (`String`)              | Событие вызывается при выборе результата поиска                                                         |
| window:open        | -                             | Происходит когда открывается `Bottom Sheet` в мобильном адаптиве                                        |
| window:close       | -                             | Происходит когда закрывается `Bottom Sheet` в мобильном адаптиве                                        |
| click:cancelButton | event (`MouseEvent`)          | Происходит при клике на кнопку отмены (при наличии параметра `cancelButton`)                            |
| click:rightButton  | event (`MouseEvent`)          | Происходит при клике на кнопку справа в поле ввода компонента (при наличии параметра `rightButtonIcon`) |
| click:groupTitle   | groupName (`String`)          | Событие вызывается при клике на заголовок группы результатов поиска                                     |

## Слоты

| Слот       | Описание                                                | Scoped Slot |
|------------|---------------------------------------------------------|-------------|
| value      | Слот для отображения своих элементов выдачи             | –           |
| inputRight | Слот для отображения контента в правой части поля ввода | –           |

## Exposes

| Имя        | Описание                    | Тип         |
|------------|-----------------------------|-------------|
| focusInput | Устанавлиает фокус на input | () => void; |

