---
title: TNCell/Doc
group: data
---

# TNCell

## Описание

Представляет собой универсальную ячейку.

## Использование

**Использование и вид можно посмотреть в [Playground](./cell-playground.story.vue)**

Полный список параметров можно [посмотреть тут](#параметры-props)

Основной параметр, через который передаются все данные компонента, это `cell-data`:

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=main)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1'
  }"
/>
```

### Иконки

Иконки можно отображать в двух местах: слева одну (поле `leftIcon`) или несколько справа (`rightIcons`):

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=icon)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    leftIcon: 'edit-2',
    rightIcons: ['more-horizontal', 'right-m']
  }"
/>
```

### Аватар пользователя

Поле `userPicture` отвечает за отображение компонента **TNUserPicture** в левой части. Вложенные поля этого поля `userPicture` отвечают за одноимённые параметры этого компонента:

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=avatar)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    userPicture: {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/e/ee/Sample_abc.jpg'
    }
  }"
/>
```

### Клик

Компонент поддерживает клик по самому себе, вызывая при этом стандартное событие `@click`:

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=click)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1'
  }"
  @click="clickHandler"
/>
```

### Чекбокс/Радио/Тумблер

В левой и правой частях можно расположить компонент **TNCheckbox**, **TNRadio** или **TNTumbler**.  
Клик по ним вызывает событие `@input`. За состояние `checked` у этих компонентов отвечает поле с соответствующим названием:

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=action)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    checkbox: true,
    checked: false
  }"
  @input="inputHandler"
/>
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    radiobutton: true,
    checked: false
  }"
  @input="inputHandler"
/>
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    tumbler: true,
    checked: false
  }"
  @input="inputHandler"
/>
```

### Отключение компонента

За отображение статуса заблокированного компонента отвечает поле `disabled`

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=disabled)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    disabled: true,
    leftIcon: 'edit-2',
    rightIcons: ['more-horizontal', 'right-m']
  }"
/>
```

Также `disabled` может принимать массив строк с названиями элементов, чтобы блокировать конкретные элементы.

`checkbox` - чекбокс слева;
`radiobutton` - радио-кнопка слева;
`tumbler` - тумблер справа;
`right-m` - названия кнопок соответствуют кнопкам из параметра rightIcons

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=disabled-array)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    checked: false,
    disabled: [],
    leftIcon: 'edit-2',
    radiobutton: true,
    rightIcons: ['more-horizontal', 'right-m']
  }"
/>
```

### Иконки справа

За расположение иконок в правой части отвечает поле `rightIconsAlignment`:

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=icon)**

```vue
<TNCell
  :cell-data="{
    title: 'Изменить виджет',
    subtitle: 'Пример или подсказка',
    id: '1',
    rightIconsAlignment: 'top',
    leftIcon: 'edit-2',
    rightIcons: ['more-horizontal', 'right-m']
  }"
/>
```

### Режим чата

Для переключения отображения компонента в **режим чата** (для списка чатов с последним сообщением и статусами) используется поле `chat`. У этого поля также есть ряд своих полей:

`body` - тело сообщения;
`time` - время отображаемое в верхнем правом углу компонента;
`status` - статус, отображаемый иконкой рядом со временем;
`pinned` - отображение иконки закреплённого чата;
`muted` - отображение иконки заглушённого чата;
`verified` - отображение иконки верифицированного чата;
`notification` - отображение счётчика уведомлений. Перекрывает иконку закреплённого чата

**[Посмотреть в Playground](./cell-playground.story.vue?variantId=chat)**

```ts
const cellData: ICellDataItem = {
  title: "Группа 1",
  subtitle: "Сангаджи Бенедиктов",
  id: "1",
  userPicture: {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Sample_abc.jpg"
  },
  chat: {
    time: "2025-02-26T07:06:13.379Z",
    status: 0,
    pinned: false,
    notification: 0,
    body: "Привет, нужно организовать встречу по вопросу нашего с тобой вз",
    muted: false,
    verified: false
  }
};
```

```vue
<TNCell :cell-data="cellData" />
```

## Параметры (props)

| Название | Тип             | Обязательность                  | Комментарий                                                     |
|----------|-----------------|---------------------------------|-----------------------------------------------------------------|
| tagName  | `string`        | &cross; (по-умолчанию: `"div"`) | Название тега для корневого элемента компонента                 |
| cellData | `ICellDataItem` | &check;                         | Данные ячейки                                                   |
| dropdown | `boolean`       | &cross; (по-умолчанию: `false`) | Форматирование ячейки для использования в компоненте TNDropdown |

## События (emits)

| Событие   | Возвращаемые данные                                                | Комментарий                                                                                       |
|-----------|--------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| input     | `{ value: boolean, id: string }`                                   | Событие вызывается при клике по Чекбоксу, Радио-кнопке и Тумблеру                                 |
| bodyClick | `{ event: PointerEvent, id: string }`                              | Событие вызывается при клике по основной части компонента, но не по прочим кликабельным элементам |
| iconClick | `{ event: PointerEvent, icon: string, id: string, index: number }` | Событие вызывается при клике по кнопке из массива иконок **cellData.rightIcons**                  |

## Слоты

**Слотов нет**
