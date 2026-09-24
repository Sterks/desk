---
title: TNTable/Doc
group: data
---

# TNTable

## Описание

Представляет собой таблицу.

## Использование

**Использование и вид можно посмотреть в [Playground](./table-playground.story.vue)**

Главными параметрами являются `header` и `data`, отвечающие за создание колонок и заполнение данных таблицы соответственно

**[Посмотреть в Playground](./table-playground.story.vue?variant=main)**

```vue
<TNTable :header="header" :data="data" />
```

## Типы и параметры данных в компоненте

```typescript
export namespace TNTable {
  // Комплексное значение ячейки таблицы
  export interface ComplexValue {
    // Тип данных ячейки таблицы
    type: DataType;
    // Простое значение
    value: string;
    // Подпись, которая будет отображаться вместо логического значения
    label?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Иконка
    icon?: IconNames;
    // (`DataType.Tag` | `DataType.UserPicture`) Цвет иконки
    iconColor?: string;
    // (`DataType.Tag` | `DataType.UserPicture`) Второстепенный цвет иконки
    iconSecondaryColor?: string;
    // (`DataType.Tag`) Правая иконка
    rightIcon?: IconNames;
    // (`DataType.Tag`) Цвет правой иконки
    rightIconColor?: string;
    // (`DataType.UserPicture`) Ссылка на изображение
    imageUrl?: string;
    // (`DataType.Text`) Отображение подсказки для текста
    tooltip?: string;
    // (`DataType.Text` | `DataType.Link`) Отображение возможности скопировать значение
    copyable?: boolean;
    // (`DataType.Component`) Vue-компонент, который будет отображаться в ячейке
    component?: object;
    // (`DataType.Component`) Передаваемые параметры vue-компонента
    bind?: Record<string, any>;
    // (`DataType.Component`) Обработчики событий vue-компонента
    events?: Record<string, Function>;
  }
  // Значение таблицы
  export type Value = string | number | undefined | ComplexValue;

  // Строка тела таблицы
  export interface Data {
    // Идентификатор строки
    id: string | number;
    // Иконки кнопки контекстного меню
    contextIcon?: IconNames;
    // Список пунктов контекстного меню
    rowMenu?: ITNDropdownMenu[];
    // Данные строки, где key - это ключ значения. В `TNTable.Header` и `TNTable.Sort` это `fieldName`
    data: {
      [key: string]: Value;
    };
  }

  // Ячейка шапки таблицы
  export interface Header {
    // Ключ для соответствия данных в строке таблицы со столбцом в шапке
    fieldName: string;
    // Заголовок столбца
    title: string;
    // Ширина столбца в пикселях
    width: number;
    // Отображение кнопки сортировки для столбца
    sort?: boolean;
    // Отображение поля фильтра
    filter?: {
      // Тип фильтрации данных таблицы
      type: FilterType;
      // Плейсхолдер для поля ввода
      placeholder?: string;
      // (`FilterType.Select`) Опции выпадающего меню
      selectOptions?: TNTreeProps.Option[];
      // Начальное значение фильтра
      initValue?: string | number | Date | null;
      // Дополнительный селектор способа фильтрации
      method?: {
        // Опции способа фильтрации
        options: { title: string; id: string }[];
        // Выбранный способ фильтрации
        selected: string;
      };
      // Заблокированное состояние
      disabled?: boolean;
    };
  }

  // Сортировка
  export interface Sort {
    // Название ключа
    fieldName: string;
    // Включена ли сортировка
    enabled: boolean;
    // Направление сортировки
    direction: SortDirection;
  }

  // Опция для выбранных строк таблицы
  export interface ListOption {
    // Заголовок
    title: string;
    // Идентификатор
    id: string;
    // Иконка
    icon?: IconNames;
    // Заблокированное состояние
    disabled?: boolean;
    // Подпись к заблокированному состоянию
    disabledAnnotation?: string;
  }
  
  // Направление сортировки
  export enum SortDirection {
    // По возрастанию
    Ascend,
    // По убыванию
    Descend
  }

  // Тип данных ячейки таблицы
  export enum DataType {
    Tag,
    Link,
    UserPicture,
    Text,
    Component
  }

  // Тип фильтрации данных таблицы
  export enum FilterType {
    // Текстовое поле
    Text,
    // Числовое поле
    Number,
    // Поле ввода даты
    Date,
    // Выпадающее меню
    Select
  }

  // Поведение при нажатии чекбокса выбора всех строк, если некоторые строки уже выбраны
  export enum SelectAllLogic {
    // Сбросить выбор со всех строк
    DataReset,
    // Выбрать все строки
    DataEnrichment
  }
}
```

### Выбрать элементы в таблице

Если требуется выбрать элементы из таблицы и совершить с ними какие-либо действия, следует использовать параметр:

- `selectable`
- `select-list`, список выбранных элементов
- `select-list-options`, список действий применимых ко всем выбранным элементам

**[Посмотреть в Playground](./table-playground.story.vue?variant=select)**

```typescript
const selectListOptions = [
  {
    title: "Отправить на доработку",
    icon: "return",
    id: "reject"
  },
  {
    title: "Отложить",
    icon: "clock",
    id: "dep",
    disabled: true,
    disabledAnnotation:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque."
  },
  {
    title: "Отклонить",
    icon: "close",
    id: "rej"
  },
  {
    title: "В архив",
    icon: "archive",
    id: "archive"
  }
];
```

```vue
<TNTable
  :header="header"
  :data="data"
  :row-menu="rowMenu"
  :header-scroll-appear="200"
  :select-list-options="selectListOptions"
  :select-list="selected"
  selectable
  @select="selectHandler"
  @toggleSort="toggleSortHandler"
  @click:link="openLinkHandler"
  @click:copy="copyLinkHandler"
/>
```

### Состояние загрузки

Для отображения загрузки элементов следует добавить параметр `loading` типа `"full" | "partial" | "none"`
Для отображения данных таблицы только при всех загруженных элементов используется `full`. Для порционного отображения загруженных элементов `partial`. Для скрытия индикатора загрузки - `none`

**[Посмотреть в Playground](./table-playground.story.vue?variant=load-state)**

```vue
<TNTable :header="header" :data="data" loading="full" />
```

### Блокировка скрытия столбцов

Для того чтобы заблокировать скрытие столбцов в настройках таблицы: disabledFields

**[Посмотреть в Playground](./table-playground.story.vue?variant=column)**

```vue
<TNTable :header="header" :data="data" :disabled-fields="['name']" />
```

### Сортировка колонок пользователем

Для включения возможности переноса колонок таблицы пользователем необходимо включить параметр `sortableColumns`. При изменении отправляется событие `columnSortUpdate` в котором передаются данные об изменённом порядке столбцов в компоненте. Полученные данные можно использовать для последующего отображения в том же порядке столбцов при инициализации с помощью параметра `initialFieldsSort`.

### Компоненты в ячейках таблицы

Для отображения кастомных компонентов в ячейках таблицы, поможет:

1. Передавать данные для ячейки в виде объекта `TNTable.ComplexValue`
2. Тип данных ячейки задать `TNTable.DataType.Component`
3. Передать в поле `component` импортированный vue-компонент
4. В поле `bind` передавать значения параметров компонентов
5. В поле `events` передавать функции, где название функции должно совпадать с `camelCase`-названием события компонента

```typescript
import TNButton from "@life_uikit/uikit/button/button.vue";
import TNTable from "@life_uikit/uikit";

const tableData: TNTable.Data = {
  id: "id",
  data: {
    componentValue: {
      type: TNTable.DataType.Component,
      value: "",
      component: TNButton,
      bind: {
        size: "md",
        icon: "star"
      },
      events: {
        click: event => {
          console.log(event);
        }
      }
    }
  }
};
```

**[Посмотреть в Playground](./table-playground.story.vue?variant=component)**

### Фильтрация данных по столбцам

Для того чтобы отображать элементы фильтрации в ячейках шапки таблицы нужно:

1. В элементах шапки `TNTable.Header` добавить поле `filter`
2. В нём обязательно передать поле `type`:
   - `FilterType.Text` - текстовое поле TNInput
   - `FilterType.Number` - текстовое поле TNInput с маской для числовых значений
   - `FilterType.Date` - пикер даты TNDatepicker
   - `FilterType.Select` - селектор TNSelector
3. Для `FilterType.Select` опции передаются параметром `selectOptions`
4. Если при инициализации должно быть предустановленное значение, то тут поможет параметр `initValue`

```typescript
const filterHeader: TNTable.Header = {
  fieldName: "type",
  title: "Тип задачи",
  width: 200,
  filter: {
    type: TNTable.FilterType.Select,
    placeholder: "Все типы",
    selectOptions: [
      {
        id: Type.Task,
        title: "Задача",
        isCheck: false,
        deep: 0
      },
      {
        id: Type.Story,
        title: "Пользовательская история",
        isCheck: false,
        deep: 0
      },
      {
        id: Type.Incident,
        title: "Инцидент",
        isCheck: false,
        deep: 0
      },
      {
        id: Type.Epic,
        title: "Эпик",
        isCheck: false,
        deep: 0
      },
    ],
    initValue: Type.Task,
  }
}
```

**[Посмотреть в Playground](./table-playground.story.vue?variant=filter-select)**

Также для управления механикой фильтрации можно:

1. В заданном поле `filter` добавить поле `method`
2. В поле `options` передать список параметров механики фильтрации
3. В поле `selected` передать `id` выбранного пункта из списка `options`

```typescript
const filterHeader: TNTable.Header = {
  fieldName: "price",
  title: "Стоимость",
  width: 200,
  filter: {
    type: TNTable.FilterType.Number,
    method: {
      options: [
        {
          title: "Больше, чем",
          id: "higher"
        },
        {
          title: "Меньше, чем",
          id: "lower"
        },
        {
          title: "Равно",
          id: "exact"
        }
      ],
      selected: "exact"
    }
  }
}
```

**[Посмотреть в Playground](./table-playground.story.vue?variant=filter-method)**

## Параметры (props)

| Название                 | Тип                                                                                                                                                                                                                           | Обязательность                                             | Комментарий                                                                                                    |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| header                   | `TNTable.Header[]`                                                                                                                                                                                                            | &check;                                                    | Массив колонок                                                                                                 |
| data                     | `TNTable.Data[]`                                                                                                                                                                                                              | &check;                                                    | Массив строк для таблицы                                                                                       |
| sort                     | `TNTable.Sort[]`                                                                                                                                                                                                              | &cross; (по-умолчанию: `[]`)                               | Массив объектов сортировки                                                                                     |
| selectList               | `(string \| number)[]`                                                                                                                                                                                                        | &cross; (по-умолчанию: `[]`)                               | Массив ID выбранных строк                                                                                      |
| rowMenu                  | `ITNDropdownMenu[]`                                                                                                                                                                                                           | &cross;                                                    | Массив пунктов для выпадающего меню строки. При непустом массиве включает выпадающее меню для строки.          |
| selectListOptions        | `TNTable.ListOption[]`                                                                                                                                                                                                        | &cross;                                                    | Массив опций для выбранных строк таблицы                                                                       |
| filterableColumns        | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Добавляет возможность фильтровать столбцы таблицы                                                              |
| sortableColumns          | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Возможность сортировать колонки, а так же менять их местами                                                    |
| selectable               | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Возможность выбрать строку таблицы                                                                             |
| loading                  | `"full" \| "partial" \| "none"`                                                                                                                                                                                               | &cross; (по-умолчанию: `"none"`)                           | Состояние загрузки таблицы                                                                                     |
| initialVisibleFields     | `String[]`                                                                                                                                                                                                                    | &cross;                                                    | Начальные видимые столбцы                                                                                      |
| disabledFields           | `String[]`                                                                                                                                                                                                                    | &cross; (по-умолчанию: `[]`)                               | Отключенные поля                                                                                               |
| headerScrollAppear       | `number`                                                                                                                                                                                                                      | &cross; (по-умолчанию: `48`)                               | Расстояние скролла, при котором появится "липкий" хедер                                                        |
| scrollOnUpdate           | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Прокрутка вверх таблицы при обновлении данных                                                                  |
| clickableRows            | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Возможность кликать на строку таблицы                                                                          |
| infoPanel                | `string`                                                                                                                                                                                                                      | &cross;                                                    | Текст для отображения в панели справа снизу                                                                    |
| skeletonItemsCount       | `number`                                                                                                                                                                                                                      | &cross; (по-умолчанию: `10`)                               | Количество строк скелетона при загрузке                                                                        |
| stickyPanelWidthCallback | `(width: number) => number`                                                                                                                                                                                                   | &cross;                                                    | Функция для коррекции ширины нижней панели                                                                     |
| showHeader               | `boolean`                                                                                                                                                                                                                     | &cross; (по-умолчанию: `true`)                             | Отображение хедера                                                                                             |
| initialFieldsSort        | `String[]`                                                                                                                                                                                                                    | &cross;                                                    | Начальное состояние сортировки столбцов. Применяется один раз при инициализации компонента                     |
| resizableColumns         | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Возможность менять ширину колонок                                                                              |
| resettableFilter         | `boolean`                                                                                                                                                                                                                     | &cross;                                                    | Добавляет кнопку сброса фильтрации в меню фильтрации столбцов. Работает при заданном параметре **resetFields** |
| resetFields              | `String[]`                                                                                                                                                                                                                    | &cross;                                                    | Cтолбцы к которым произойдёт сброс фильтрации при нажатии кнопки сброса **resettableFilter**                   |
| scrollAutoHideDelay      | `Number \| String`                                                                                                                                                                                                            | &cross;                                                    | Задержка авто-скрытия скроллбаров                                                                              |
| outerVisibleFields       | `String[]`                                                                                                                                                                                                                    | &cross;                                                    | Принимает в себя массив полей, которые будут видны. **Используется при фильтрации**                            |
| closeSettingsOnScroll    | `boolean`                                                                                                                                                                                                                     | &cross; (по-умолчанию: `true`)                             | Возможность закрытия настроек при скролле                                                                      |
| selectedRowId            | `string`                                                                                                                                                                                                                      | &cross;                                                    | ID выбранной строки таблицы                                                                                    |
| selectAllLogic           | `TNTable.SelectAllLogic`                                                                                                                                                                                                      | &cross; (по-умолчанию: `TNTable.SelectAllLogic.DataReset`) | Функционал изменение поведения кнопки "выбрать все" при выбранных элементах                                    |
| popperOptions            | `{ headerDatepicker?: IPopoverOptions, headerSelect?: IPopoverOptions, headerDropdown?: IPopoverOptions, contextDropdown?: IPopoverOptions, textCellTooltip?: IPopoverOptions, disabledAnnotationTooltip?: IPopoverOptions }` | &cross;                                                    | Набор полей передачи параметра `popperOptions` различным внутренним компонентам                                |
| scrollAutoHide           | `boolean \| string`                                                                                                                                                                                                           | &cross; (по-умолчанию: `true`)                             | Настройка параметра autoHide для `TNScroll` тела таблицы                                                       |

## События (emits)

| Событие             | Возвращаемые данные                                                                           | Комментарий                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| select              | `string[] \| number[]`                                                                        | Вызывается при выборе строки **(в `selectable` таблице)**                                                                           |
| click:option        | `string`                                                                                      | Вызывается при клике на опцию в нижнем окне **(появляется если выбрать строку в `selectable` таблице)**                             |
| toggleSort          | `TNTable.Sort`                                                                                | Вызывается при клика на стрелку сортировки                                                                                          |
| select:filter       | `string[]`                                                                                    | Вызывается когда изменяется опция в фильтре таблицы **(в таблице с `filterable-columns`)**                                          |
| select:dropdown     | `{ optionId: string, itemId: string \| number \| null}`                                       | Вызывается при выборе опции в дропдауне контекстного меню ячейки **(если в ячейке включено контекстное меню)**                      |
| click:tag           | `{ itemId: string \| number, fieldName: string }`                                             | Вызывается при клике на тег **(тип ячейки: `DataType.Tag`)**                                                                        |
| click:link          | `{ itemId: string \| number, fieldName: string, value: string }`                              | Вызывается при клике на ссылку внутри таблицы **(тип ячейки: `DataType.Link`)**                                                     |
| click:copy          | `{ itemId: string \| number, fieldName: string, value: string }`                              | Вызывается при клике на иконку копирования рядом с ссылкой **(тип ячейки: `DataType.Link`)**                                        |
| click:context       | `string \| number`                                                                            | Вызывается при клике на три точки в ячейке **(если в ячейке включено контекстное меню)**                                            |
| click:row           | `string \| number`                                                                            | Вызывается при клике на строку таблицы **(если включен `clickableRows`)**                                                           |
| columnSortUpdate    | `string[]`                                                                                    | Вызывается при сбросе фильтрации **(если включен `filterable-columns`)** и при сдвиге столбца **(если включен `sortable-columns`)** |
| filter:selectMethod | `{ value: string, fieldName: string }`                                                        | Вызывается при выборе метода фильтрации **(если включена фильтрация у колонки)**                                                    |
| filter:input        | `{ fieldName: string, value: string \| number \| Date \| (string \| number)[] \| undefined }` | Вызывается при вводе данных в поля ввода фильтров по столбцам                                                                       |
| filter:search       | `{ fieldName: string, value: string, selected: (string \| number)[] }`                        | Вызывается при поиске в компоненте MultiSelect (если включен `searchable` в настройках столбца)                                     |
| scroll              | `Event`                                                                                       | Вызывается при скролле                                                                                                              |

## Слоты

| Слот                | Описание                                                             | Scoped Slot                                                                                                                                                                                                                                                                                                                                                |
|---------------------|----------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| header              | Слот для кастомного хедера                                           | –                                                                                                                                                                                                                                                                                                                                                          |
| stickyHeader        | Слот для кастомного "липкого" хедера (появляется при скролле)        | –                                                                                                                                                                                                                                                                                                                                                          |
| settings            | Слот для контента                                                    | `columnFilterMenu` - опции выбора, тип данных: `ITNDropdownMenu[]`; `disabledFields` - id отключенных полей, тип данных: `string[]`; `visibleFields` - id видимых полей, тип данных: `string[]`; `reset` - сброс, тип данных: `() => void`; `select` - выбор поля, тип данных: `(fieldValue: string) => void`; `close` - закрыть, тип данных: `() => void` |
| empty               | Слот для пустой таблицы                                              | –                                                                                                                                                                                                                                                                                                                                                          |
| `cell-${fieldName}` | Динамический слот для кастомной отрисовки ячейки конкретного столбца | `row` - объект строки, тип: `TNTable.Data`; `data` - значение ячейки, тип: `TNTable.Value`; `fieldName` - ключ столбца, тип: `string`                                                                                                                                                                                                                      |
| footer              | Слот для кастомного футера                                           | –                                                                                                                                                                                                                                                                                                                                                          |
