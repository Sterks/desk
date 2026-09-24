---
title: TNTextarea/Doc
group: form
---

# TNTextArea

## Описание

Представляет собой textarea поле ввода.

## Использование

**Использование и вид можно посмотреть в [Playground](./textarea-playground.story.vue)**

Для использования необходим параметры modelValue

**[Посмотреть в Playground](./textarea-playground.story.vue?variantId=main)**

```vue
<TNTextarea v-model="text" />

<TNTextarea :model-value="text" @update:modelValue="text = $event" />
```

### Внешний вид

Можно редактировать внешний вид компонента, а именно: заголовок, описание, индикатор-звездочку (обязательность), плейсхолдер, минимальную и максимальную высоты, активность компонента.

**[Посмотреть в Playground](./textarea-playground.story.vue?variantId=appearance)**

```vue
<TNTextarea
  v-model="text"
  label="Заголовок компонента"
  description="Описание компонента"
  placeholder="Плейсхолдер"
  :disabled="isDisabled"
  required
  min-height="48"
  max-height="128"
/>
```

У текстового поля есть возможность установки кастомных классов для тега
`textarea` с помощью параметра `textareaClass`:

**[Посмотреть в Playground](./textarea-playground.story.vue?variantId=class)**

```css
.my-custom-textarea-class {
  background-color: aquamarine;
}
```

```vue
<TNTextarea v-model="textareaText" textarea-class="my-custom-textarea-class" />
```

### Параметры состояния

Состояние компонента `Datepicker` можно отображать с помощью параметров:

- `error` - параметр для отображения текста ошибки
- `warn` - параметр для отображения текста предупреждения
- `success` - параметр для отображения текста успеха

Элементы отрисовываются при заполнении соответствующих параметров.

**[Посмотреть в Playground](./textarea-playground.story.vue?variantId=state-param)**

```vue
<TNTextarea
  v-model="text"
  :success="isCompleted ? 'Успешно' : ''"
  :warn="hasWarn ? 'Возможно появление ошибки' : ''"
  :error="hasError ? 'Ошибка исполнения' : ''"
/>
```

### Доступные слоты

**[Посмотреть в Playground](./textarea-playground.story.vue?variantId=slot)**

```vue
<TNTextarea v-model="text">
  <template #label>
    <span>Кастомный заголовок компонента</span>
  </template>  
  <template #description>
    <span>Кастомное описание компонента</span>
  </template>  
  <template #header>
    <TNCard>
      ... // Кастомное наполнение хедера
    </TNCard>
  </template>  
  <template #footer>
    <TNCard>
      ... // Кастомное наполнение футера
    </TNCard>
  </template>  
</TNTextarea>
```

## Параметры (props)

| Название              | Тип       | Обязательность                | Комментарий                                                                                                              |
|-----------------------|-----------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| label                 | `string`  | &cross;                       | Заголовок компонента                                                                                                     |
| required              | `boolean` | &cross;                       | Выводит звездочку после заголовка компонента - лейбла                                                                    |
| description           | `string`  | &cross;                       | Текст описания компонента                                                                                                |
| error                 | `string`  | &cross;                       | Текст ошибки (включает «error» стиль у компонента)                                                                       |
| warn                  | `string`  | &cross;                       | Текст предупреждения (включает «warning» стиль у компонента)                                                             |
| success               | `string`  | &cross;                       | Текст успеха (включает «success» стиль у компонента)                                                                     |
| placeholder           | `string`  | &cross;                       | Плейсхолдер                                                                                                              |
| readonly или disabled | `boolean` | &cross;                       | Делает компонент доступным только для чтения                                                                             |
| modelValue            | `string`  | &cross;                       | Значение value переменной для компонента                                                                                 |
| textareaClass         | `string`  | &cross;                       | Кастомный класс для тега **textarea**                                                                                    |
| rows                  | `number`  | &cross; (по-умолчанию: `2`)   | Минимальное количество строк компонента                                                                                  |
| minHeight             | `number`  | &cross; (по-умолчанию: `68`)  | Минимальная высота компонента                                                                                            |
| maxHeight             | `number`  | &cross; (по-умолчанию: `248`) | Максимальная высота компонента                                                                                           |
| smoothMessage         | `boolean` | &cross;                       | Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента) |

## События (emits)

| Событие           | Возвращаемые данные   | Комментарий                                  |
|-------------------|-----------------------|----------------------------------------------|
| update:modelValue | modelValue (`string`) | Событие вызывается при обновлении modelValue |

## Слоты

| Слот        | Описание                     | Scoped Slot |
|-------------|------------------------------|-------------|
| header      | Слот для кастомного хедера   | —           |
| label       | Слот для кастомного названия | —           |
| description | Слот для кастомного описания | —           |
| footer      | Слот для кастомного футера   | —           |
