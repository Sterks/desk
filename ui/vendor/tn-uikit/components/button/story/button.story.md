---
title: TNButton/Doc
group: form
---

# TNButton

## Использование

**Использование и вид можно посмотреть в [Playground](./button-style.story.vue)**

### Стили и состояния

У кнопок есть 5 цветовых схем, которые активируются параметром `type`:

- `"action"` - Кнопка действия (по-умолчанию).
- `"secondary"` - Простая кнопка.
- `"outline"` - Кнопка с обводкой.
- `"link"` - Кнопка, визуально напоминающая ссылку.
- `"white"` - Кнопка белая.

**[Посмотреть в Playground](./button-style.story.vue?variantId=styles)**

```vue
<TNButton type="action">Кнопка действия</TNButton>
<TNButton type="secondary">Простая кнопка</TNButton>
<TNButton type="outline">Кнопка с обводкой</TNButton>
<TNButton type="link">Кнопка ссылка</TNButton>
<TNButton type="white">Кнопка белая</TNButton>
```

### Размеры

Для каждого типа кнопки есть 4 размера:

- `sm` — Маленькая кнопка (по-умолчанию).
- `md` — Средняя кнопка
- `lg` — Большая кнопка.
- `xl` — Очень большая кнопка.

**[Посмотреть в Playground](./button-style.story.vue?variantId=size)**

```vue
<TNButton size="xl">Кнопка</TNButton>
<TNButton size="lg">Кнопка</TNButton>
<TNButton size="md">Кнопка</TNButton>
<TNButton size="sm">Кнопка</TNButton>
```

### Скругления

Для получения скругленной кнопки, нужно передать props `rounded`

**[Посмотреть в Playground](./button-style.story.vue?variantId=rounded)**

```vue
<TNButton rounded>Кнопка</TNButton>
```

### Block

По-умолчанию кнопка является `inline-block` элементом.

При необходимости её можно сделать блочным при помощи параметра `block` и она будет занимать 100% доступной ширины:

**[Посмотреть в Playground](./button-style.story.vue?variantId=block)**

```vue
<TNButton block>Кнопка действие</TNButton>
```

### Disabled

Как и обычную кнопку, нашу кнопку можно сделать неактивной при помощи параметра `disabled`:

**[Посмотреть в Playground](./button-style.story.vue?variantId=disabled)**

```vue
<TNButton disabled>Кнопка действие</TNButton>
```

### Иконки

Элемент поддерживает набор иконок.

Назначение иконки из набора происходит через параметры:

- `icon` — Основная иконка или иконка слева.
- `icon-right` — Иконка, отображаемая справа от текста.

**[Посмотреть в Playground](./button-style.story.vue?variantId=icon)**

```vue
<TNButton icon="star">Улучшить</TNButton>
<TNButton icon-right="star">Улучшить</TNButton>
```

### Кнопки-иконки

Если в кнопку не передавать контент, а только указать иконку, то получим квадратную кнопку-иконку:

**[Посмотреть в Playground](./button-style.story.vue?variantId=button-icon)**

```vue
<TNButton icon="star" />
```

### Добавление иконки через слот

Установка иконки также возможна через одноимённые слоты icon и icon-right.

Через них можно пробросить компонент TNIcon или SVG-разметку:

**[Посмотреть в Playground](./button-style.story.vue?variantId=customSVG)**

```vue
<!-- TNIcon -->

<TNButton>
  <TNIcon slot="icon" name="help" />
</TNButton>

<!-- Custom SVG -->

<TNButton>
  В избранное
  <template slot="icon-right">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.00004 1.33333L10.06 5.50666L14.6667 6.18L11.3334
          9.42666L12.12 14.0133L8.00004 11.8467L3.88004 14.0133L4.66671
          9.42666L1.33337 6.18L5.94004 5.50666L8.00004 1.33333Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </template>
</TNButton>
```

Обратите внимание, что основной цвет элементов иконки желательно указать как `currentColor`, чтобы компонент мог автоматически их перекрасить при изменении стиля.

Также желательно, чтобы соотношение сторон иконки было `1:1`, как в примере выше.

### Кнопка в качестве ссылки

Для любой кнопки есть возможность проброса ссылки для открытия — реализовано за счет параметра `href` с типом `string`. По умолчанию, ссылка будет открыта при помощи vue-router. По необходимости открыть ссылку с обновлением страницы, необходимо установить параметр `norouter`. Если нужно открыть ссылку в новой вкладке, поможет параметр `target="_blank"`:

**[Посмотреть в Playground](./button-style.story.vue?variantId=href)**

```vue
<TNButton href="/" icon="home-light"> На главную</TNButton>

<TNButton href="/buttons#icons" icon="image" norouter secondary>
  Кнопки с иконками
</TNButton>

<TNButton link href="https://www.google.com/" target="_blank">
  Открыть Google в новой вкладке
</TNButton>
```

### Загрузка

Для любой кнопки есть возможность отображения состояния загрузки — реализовано за счет параметра `loading`:

**[Посмотреть в Playground](./button-style.story.vue?variantId=loading)**

```vue
<TNButton :loading="isLoading">Кнопка</TNButton>
<TNButton loading>Кнопка</TNButton>
```

## Параметры (props)

| Название         | Тип                                                         | Обязательность                     | Комментарий                                                                                                             |
|------------------|-------------------------------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| size             | `"sm" \| "md" \| "lg" \| "xl"`                              | &cross; (по-умолчанию: `"sm"`)     | Размер кнопки                                                                                                           |
| type             | `"secondary" \| "action" \| "outline" \| "white" \| "link"` | &cross; (по-умолчанию: `"action"`) | Стиль кнопки                                                                                                            |
| rounded          | `boolean`                                                   | &cross; (по-умолчанию: `false`)    | Скруглить углы кнопки                                                                                                   |
| link             | `boolean`                                                   | &cross;                            | Сделать кнопку текстовой (без фона)                                                                                     |
| disabled         | `boolean`                                                   | &cross;                            | Отключить кнопку (применяется disabled стиль)                                                                           |
| block            | `boolean`                                                   | &cross;                            | Применяет кнопке стиль "display: block", из-за чего ширина кнопки становится 100% от родительского контейнера           |
| loading          | `boolean`                                                   | &cross; (по-умолчанию: `false`)    | Отключает кнопку и включает состояние загрузки (loader)                                                                 |
| icon             | `IconNames`                                                 | &cross;                            | Вставка иконки слева                                                                                                    |
| iconRight        | `IconNames`                                                 | &cross;                            | Вставка иконки справа                                                                                                   |
| href             | `string`                                                    | &cross;                            | Открывает проброшенную ссылку через Vue Router. Должна быть валидным URL                                                |
| target           | `_blank`                                                    | &cross;                            | Открывает проброшенную в параметре `href` ссылку в новой вкладке. параметр norouter использовать при этом необязательно |
| iconSizeOverride | `string \| number`                                          | &cross;                            | Устанавливает размер иконки (в пикселях)                                                                                |

## События (emits)

| Событие | Возвращаемые данные | Комментарий                  |
|---------|---------------------|------------------------------|
| click   | `Event`             | Событие вызывается при клике |

## Слоты

| Слот       | Описание                         | Scoped Slot |
|------------|----------------------------------|-------------|
| default    | Слот для контента                | —           |
| icon       | Слот для кастомной иконки слева  | —           |
| icon-right | Слот для кастомной иконки справа | —           |
