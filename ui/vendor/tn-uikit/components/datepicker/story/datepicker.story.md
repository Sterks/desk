---
title: TNDatepicker/Doc
group: form
---

# Datepicker

## Описание

Компонент всплывающего окна выбора дат. В "нераскрытом" состоянии выглядит как **TNInput**

## Использование

Компонент может взаимодействовать силами v-model и задаёт значение в
виде объекта типа `Date`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=main)**

```vue
<TNDatepicker v-model="date" />
```

```ts
const date: Date | null = null;
```

### Задание доступного количества лет

Компонент поддерживает выбор промежутка лет с помощью параметра `yearRange`.
Указывается в типе `string | number` числом, например `'50'`

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=year-range)**

```vue
<TNDatepicker year-range="50" />
```

### Указание времени

Для указания времени используется булевый параметр `time`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=time)**

```vue
<TNDatepicker v-model="dateWithTime" time />
```

Чтобы задать шаг выбора минут (0, 15, 30, 45) используется параметр `minuteStep`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=time)**

```vue
<TNDatepicker v-model="dateWithTime" time :minute-step="15" />
```

Пока значение не выбрано, селекторы времени можно предзаполнить с помощью
параметра `defaultTime` в формате `"HH:mm"` — первый выбор даты сразу вернёт
дату с этим временем. Если указанные час или минута недоступны
(`disabledHours`, `disabledMinutes`, сетка `minuteStep`), подставляется
ближайшее доступное значение:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=default-time)**

```vue
<TNDatepicker v-model="dateWithTime" time default-time="12:30" />
```

### Подтверждение выбора

По умолчанию при выборе даты календарь закрывается автоматически но для
некоторых случаев можно добавить кнопку подтверждения с помощью
артибута `confirm`.

Для выбора времени `time`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=time-confirm)**

```vue
<TNDatepicker v-model="dateWithTime" time confirm />
```

### Блокировка выбора

Для общего правила блокировки даты используется параметр `disabledDates`,
который поддерживает два типа:

Массив объектов `Date`:

**[Посмотреть в Playground](./datepicker-block.story.vue?variantId=disabled-dates)**

```ts
const disabledDatesArray: Date[] = [
  "2024-08-13T00:00:00.000Z",
  "2024-08-14T00:00:00.000Z"
];
```

```vue
<TNDatepicker v-model="date" :disabled-dates="disabledDatesArray" />
```

И функцию, принимающую один параметр объект `Date` и возвращающая `boolean`:

**[Посмотреть в Playground](./datepicker-block.story.vue?variantId=disabled-function)**

```ts
const disableWeekend = (date: Date): boolean => {
  const weekDay = date.getDay();
  return [0, 6].includes(weekDay);
};
```

```vue
<TNDatepicker v-model="date" :disabled-dates="disableWeekend" />
```

Есть возможность блокировать часы для выбора даты со временем с
помощью параметра `disabledHours`:

**[Посмотреть в Playground](./datepicker-block.story.vue?variantId=disabled-hours)**

```ts
const disabledHours: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23];
```

```vue
<TNDatepicker v-model="dateWithTime" time :disabled-hours="disabledHours" />
```

Минуты блокируются параметром `disabledMinutes` — перечисленные минуты
недоступны во всех часах:

**[Посмотреть в Playground](./datepicker-block.story.vue?variantId=disabled-hours)**

```ts
const disabledMinutes: number[] = [5, 10, 15, 20, 25, 35, 40, 45, 50, 55];
```

```vue
<TNDatepicker v-model="dateWithTime" time :disabled-minutes="disabledMinutes" />
```

Если в часе не осталось ни одной доступной минуты, такой час так же становится
недоступным для выбора. При выборе часа, в котором текущая минута запрещена,
минута автоматически сдвигается на первую доступную, и `modelValue` обновляется.

### Локализация

Самостоятельно Дейтпике поддерживает два языка локализации через параметр `locale`:
русский (по-умолчанию) `ru` и английский `en`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=locale)**

```vue
<TNDatepicker v-model="date" time locale="en" />
```

Так же есть возможность задать полностью свою модель локализации с помощью параметра `customLocale`:

**[Посмотреть в Playground](./datepicker-types.story.vue?variantId=custom-locale)**

```ts
import { IDatepickerLocateConfig } from "@life_uikit/uikit";

const customLocale: IDatepickerLocateConfig = {
  monthLabelList: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember"
  ],
  shortWeekdayLabels: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  doneButtonLabel: "Erledigt"
};
```

```vue
<TNDatepicker v-model="dateWithTime" time :custom-locale="customLocale" />
```

### Datepicker disabled

Компонент `Datepicker` можно отключить с помощью параметра `disabled`.

**[Посмотреть в Playground](./datepicker-states.story.vue?variantId=disabled)**

### Datepicker required

Компонент `Datepicker` можно пометить обязательным с помощью параметра `required`.

**[Посмотреть в Playground](./datepicker-states.story.vue?variantId=required)**

### Параметры состояния

Состояние компонента `Datepicker` можно отображать с помощью параметров:

- `error` - параметр для отображения текста ошибки
- `warn` - параметр для отображения текста предупреждения
- `success` - параметр для отображения текста успеха

**[Посмотреть в Playground](./datepicker-states.story.vue?variantId=state-param)**

### TNPopover

Компонент использует **TNPopover**, некоторыми параметрами можно управлять. [Подробнее](../../popover/story/popover.story.md)

## Параметры (props)

| Название               | Тип                       | Обязательность                          | Комментарий                                                                                                                                                                        |
|------------------------|---------------------------|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| size                   | `"s" \| "m"`              | &cross; (по-умолчанию: `"m"`)           | Размер компонента                                                                                                                                                                  |
| disabled               | `boolean`                 | &cross;                                 | Отключение компонента                                                                                                                                                              |
| label                  | `string`                  | &cross; (по-умолчанию: `""`)            | Текст заголовка компонента                                                                                                                                                         |
| description            | `string`                  | &cross; (по-умолчанию: `""`)            | Текст описания компонента                                                                                                                                                          |
| modelValue             | `Date`                    | &cross;                                 | Значение для компонента                                                                                                                                                            |
| locale                 | `"ru" \| "en"`            | &cross; (по-умолчанию: `"ru"`)          | Выбор предустановленной локализации                                                                                                                                                |
| customLocale           | `IDatepickerLocateConfig` | &cross;                                 | Ручная настройка локализации                                                                                                                                                       |
| time                   | `boolean`                 | &cross;                                 | Возможность ввода времени для выбора даты                                                                                                                                          |
| defaultTime            | `` `${number}:${number}` `` | &cross;                               | Время по умолчанию при первом выборе даты в формате `"HH:mm"` (работает в режиме `time`)                                                                                           |
| required               | `boolean`                 | &cross;                                 | Отображение звездочки после заголовка компонента - лейбла                                                                                                                          |
| error                  | `string`                  | &cross;                                 | Текст ошибки (включает «error» стиль у компонента)                                                                                                                                 |
| warn                   | `string`                  | &cross;                                 | Текст предупреждения (включает «warning» стиль у компонента)                                                                                                                       |
| success                | `string`                  | &cross;                                 | Текст успеха (включает «success» стиль у компонента)                                                                                                                               |
| teleportTo             | `string`                  | &cross; (по-умолчанию: `"main"`)        | Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева                                                                                                              |
| isMobileMiniApp        | `boolean`                 | &cross;                                 | Передача одноименного параметра для боттом-щита                                                                                                                                    |
| yearRange              | `string \| number`        | &cross; (по-умолчанию: `50`)            | Количество лет доступное для выбора. Если указано `maxYear`, то `yearRange` будет высчитываться от верхнего значения вниз (минимальный год для выбора будет `maxYear - yearRange`) |
| disabledDates          | `Date[] \| IDisableDates` | &cross; (по-умолчанию: `[]`)            | Запрещенные для выбора даты                                                                                                                                                        |
| disabledHours          | `Number[]`                | &cross; (по-умолчанию: `[]`)            | Запрещенные для выбора часы                                                                                                                                                        |
| disabledMinutes        | `Number[]`                | &cross; (по-умолчанию: `[]`)            | Запрещенные для выбора минуты (во всех часах)                                                                                                                                      |
| minuteStep             | `string \| number`        | &cross; (по-умолчанию: `1`)             | Шаг минут                                                                                                                                                                          |
| confirm                | `boolean`                 | &cross;                                 | Включает ожидание подтверждения при выборе даты                                                                                                                                    |
| bottomSheetCustomClass | `string`                  | &cross; (по-умолчанию: `""`)            | Задание кастомного класса для боттом-щита                                                                                                                                          |
| hideInput              | `boolean`                 | &cross;                                 | Скрыть триггер-элемент инпут                                                                                                                                                       |
| showPicker             | `boolean`                 | &cross;                                 | Показать всплывающее окно компонента                                                                                                                                               |
| clearable              | `boolean`                 | &cross; (по-умолчанию: `true`)          | Добавляет кнопку с крестиком для возможности очистить выбор                                                                                                                        |
| position               | `Placement`               | &cross; (по-умолчанию: `"bottom-left"`) | Позиционирование всплывающего окна компонента относительно "триггер" элемента                                                                                                      |
| flip                   | `boolean`                 | &cross; (по-умолчанию: `true`)          | Отображать всплывающее окно с другой стороны, если с нужной не хватает места. Например, если окно отображается сверху, то если сверху мало места, то будет отображено снизу        |
| shift                  | `boolean`                 | &cross;                                 | Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана                                                                                                                 |
| popperOptions          | `IPopoverOptions`         | &cross;                                 | Опции для всплывающего окна                                                                                                                                                        |
| smoothMessage          | `boolean`                 | &cross;                                 | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)                                                           |
| maxYear                | `string \| number`        | &cross; (по-умолчанию: `0`)             | Ограничивает верхнее значение выбора года. Если указано, то `yearRange` будет высчитываться от верхнего значения вниз (минимальный год для выбора будет `maxYear - yearRange`)     |

## События (emits)

| Событие           | Возвращаемые данные              | Комментарий                                    |
|-------------------|----------------------------------|------------------------------------------------|
| update:modelValue | modelValue (`Date \| undefined`) | Событие вызывается при изменении modelValue    |
| open              | -                                | Событие вызывается при открытии TNDatePicker'a |
| close             | -                                | Событие вызывается при закрытии TNDatePicker'a |

## Слоты
| Слот        | Описание                                 | Scoped Slot |
|-------------|------------------------------------------|-------------|
| header      | Слот для кастомного header'a             | –           |
| label       | Слот для кастомного заголовка компонента | –           |
| description | Слот для кастомного описания компонента  | –           |
| footer      | Слот для кастомного footer'a             | –           |
