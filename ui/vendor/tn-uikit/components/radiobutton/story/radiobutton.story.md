---
title: TNRadio/Doc
group: form
---

# TNRadio

## Описание

Представляет собой радио-кнопку с лейблом

## Использование

**Использование и вид можно посмотреть в [Playground](./radiobutton-playground.story.vue)**

В `itemValue` задается значение конкретной радио-кнопки, в `summaryValue` - выбранное значение.  
Если значения совпадают - кнопка окрашивается

```vue
<TNRadio
  :item-value="1"
  label="Собака"
  :summary-value="animal"
  @input="animal = $event"
/>

<TNRadio
  :item-value="2"
  label="Предупреждающая собака"
  :summary-value="animal"
  warn="Warn description"
  @input="animal = $event"
/>

<TNRadio
  error="Error description"
  :item-value="1"
  label="Ошибающаяся собака"
  :summary-value="animal"
  @input="animal = $event"
/>
```

## Параметры (props)

| Название   | Тип                | Обязательность               | Комментарий                                                          |
|------------|--------------------|------------------------------|----------------------------------------------------------------------|
| label      | `string`           | &cross;                      | Текст рядом с кнопкой                                                |
| itemValue  | `Number \| String` | &check;                      | Значение данного элемента в списке радио-кнопок                      |
| modelValue | `Number \| String` | &cross; (по-умолчанию: `""`) | Значение выбранного элемента                                         |
| disabled   | `boolean`          | &cross;                      | Делает радио-кнопку недоступной к выбору, не влияя на ее выбранность |
| error      | `string`           | &cross;                      | Текст ошибки (включает «error» стиль у компонента)                   |
| warn       | `string`           | &cross;                      | Текст предупреждения (включает «warning» стиль у компонента)         |

## События (emits)

| Событие           | Возвращаемые данные            | Комментарий                               |
|-------------------|--------------------------------|-------------------------------------------|
| input             | itemValue (`Number \| String`) | Вызывается при выборе данной радио-кнопки |
| update:modelValue | itemValue (`Number \| String`) | Вызывается при выборе данной радио-кнопки |

## Слоты

| Слот  | Описание                        | Scoped Slot |
|-------|---------------------------------|-------------|
| label | Слот для текста рядом с кнопкой | –           |
