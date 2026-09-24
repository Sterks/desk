---
title: TNInput/Doc
group: form
---

# TNInput

## Описание

Представляет собой поле ввода.

## Использование

**Использование и вид можно посмотреть в [Playground](./input-playground.story.vue)**

Значение задается через `v-model` или через параметр `modelValue` и событие `@update:modelValue`

**[Посмотреть в Playground](./input-playground.story.vue?variantId=main)**

```vue
<TNInput v-model="query" />
<TNInput :model-value="query" @update:modelValue="updateQuery" />
```

### Информативные параметры

Обозначения для поля ввода, такие как заголовок, описание, placeholder, тексты успеха/ошибки/предупреждения задаются соответствующими параметрами

**[Посмотреть в Playground](./input-playground.story.vue?variantId=info-param)**

```vue
<TNInput
  v-model="query"
  label="Заголовок"
  description="Описание"
  placeholder="Плейсхолдер"
  warn="Текст предупреждения (включает «warning» стиль у компонента)"
  success="Текст успеха"
  error="Текст ошибки"
/>
```

### Внешний вид

Внешне компонент так же можно менять с помощью параметров:  
размер, обязательность (звездочка рядом с заголовком), отключение, очищаемость, собственный класс для компонента и определенные стили для элемента <input>

**[Посмотреть в Playground](./input-playground.story.vue?variantId=appearance)**

```vue
<TNInput
  v-model="query"
  required
  :disabled="isDisabled"
  :styles="{ 'font-size': '12px' }"
  size="m"
  input-class="input-component__input-element-class"
/>
```

### Маска ввода

Компонент поддерживает `маски` ввода. Маска задается параметром `maskTemplate`.  
Для формирования маски следует ознакомиться с [документацией по маскам](https://beholdr.github.io/maska/v3/#/tokens)  
Например, чтобы сделать маску для ввода номера телефона с видом `+7 777 777-77-77` потребуется маска `+# ### ###-##-##`

**[Посмотреть в Playground](./input-playground.story.vue?variantId=mask-input)**

```vue
<TNInput v-model="query" mask-template="######-@@@" />
```

### Использование слотов

Также компонент поддерживает `слоты`

**[Посмотреть в Playground](./input-playground.story.vue?variantId=slot)**

```vue
<TNInput v-model="query">
  <template #header>
    <div>Здесь будет мой новый хедер</div>
  </template>
  <template #label>
    <h1>
      Новый заголовок компонента
    </h1>
  </template>
  <template #description>
    <span>Новое описание для компонента</span>
  </template>
  <template #icon>
    <span>Содержимое будет показано справа в поле ввода</span>
    <TNIcon name="message" />
  </template>
  <template #footer>
    <div>Здесь будет мой новый футер</div>
  </template>
</TNInput>
```

### Использование событий

Доступны `события` для обработки

**[Посмотреть в Playground](./input-playground.story.vue?variantId=main)**

```vue
<TNInput
  v-model="query"
  @update:modelValue="handleModelValueUpdate"
  @enter="handleEnter"
  @focus="handleFocus"
  @blur="handleBlur"
/>
```

## Параметры (props)

| Название        | Тип                                                   | Обязательность                | Комментарий                                                                                                                             |
|-----------------|-------------------------------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| required        | `boolean`                                             | &cross;                       | Выводит звездочку после заголовка компонента - лейбла                                                                                   |
| readonly        | `boolean`                                             | &cross;                       | Делает невозможным менять содержимое, но не влияет на отображение в нем данных                                                          |
| disabled        | `boolean`                                             | &cross;                       | Делает невозможным менять содержимое, но не влияет на отображение в нем данных                                                          |
| clearable       | `boolean`                                             | &cross;                       | Функционал очистки содержимого по кнопке                                                                                                |
| styles          | `Record<string, string>`                              | &cross;                       | Стили для элемента input                                                                                                                |
| size            | `"s" \| "m"    `                                      | &cross; (по-умолчанию: `"m"`) | Размер компонента                                                                                                                       |
| label           | `string`                                              | &cross;                       | Текст для заголовка компонента                                                                                                          |
| description     | `string`                                              | &cross;                       | Текст для описания компонента                                                                                                           |
| error           | `string`                                              | &cross;                       | Текст ошибки (включает «error» стиль у компонента)                                                                                      |
| warn            | `string`                                              | &cross;                       | Текст предупреждения (включает «warning» стиль у компонента)                                                                            |
| success         | `string`                                              | &cross;                       | Текст успеха (включает «success» стиль у компонента)                                                                                    |
| placeholder     | `string`                                              | &cross; (по-умолчанию: `""`)  | Текст заглушка при пустом поле ввода                                                                                                    |
| modelValue      | `string`                                              | &cross; (по-умолчанию: `""`)  | Значение value переменной для компонента                                                                                                |
| inputClass      | `string`                                              | &cross;                       | Класс для элемента input                                                                                                                |
| maskTemplate    | `string`                                              | &cross;                       | Шаблон маскирования вводимого текста. Формирование можно посмотреть в [документации Maska](https://beholdr.github.io/maska/v3/#/tokens) |
| numericKeyboard | `"decimal" \| "numeric" \| "tel" \| "email" \| "url"` | &cross;                       | Управление параметром [inputmode](https://developer.mozilla.org/ru/docs/Web/HTML/Global_attributes/inputmode)                           |
| maskTokens      | `MaskTokens`                                          | &cross;                       | Задание собственных токенов для шаблона маскирования                                                                                    |
| smoothMessage   | `boolean`                                             | &cross;                       | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)                |

## События (emits)

| Событие           | Возвращаемые данные            | Комментарий                                  |
|-------------------|--------------------------------|----------------------------------------------|
| update:modelValue | modelValue (`string`)          | Событие вызывается при обновлении modelValue |
| blur              | $event (`$event.target.value`) | Событие вызывается при расфокусировке Input  |
| focus             | $event (`$event.target.value`) | Событие вызывается при фокусировке на Input  |
| enter             | $event (`$event.target.value`) | Событие вызывается при нажатии на Enter      |

## Слоты

| Слот        | Описание                                 | Scoped Slot |
|-------------|------------------------------------------|-------------|
| header      | Слот для кастомного header'a             | –           |
| label       | Слот для кастомного заголовка компонента | –           |
| description | Слот для кастомного описания компонента  | –           |
| icon        | Слот для кастомной иконки                | –           |
| footer      | Слот для кастомного footer'a             | –           |
