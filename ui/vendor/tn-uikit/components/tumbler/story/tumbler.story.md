---
title: TNTumbler/Doc
group: form
---

# Параметры

### Disabled

Тумблер можно сделать неактивным при помощи параметра `disabled`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=disabled)**

```vue
<TNTumbler label="Тумблер" disabled />
```

### Block

Для отображения элемента на всю ширину есть параметр `block`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=block)**

```vue
<TNTumbler label="Тумблер" block />
```

### Description

Тумблер можно добавить описание с помощью параметра `description`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=description)**

```vue
<TNTumbler label="Тумблер" description="Description"></TNTumbler>
```

### Error

Для отображения ошибок у тумблера параметр `error`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=error)**

```vue
<TNTumbler label="Тумблер" error="Error description"></TNTumbler>
```

### Warn

Для отображения предупреждений у тумблера параметр `warn`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=warn)**

```vue
<TNTumbler label="Тумблер" warn="Warn description"></TNTumbler>
```

### Left label

Для тумблера существует возможность расположения текста слева от переключателя
с помощью параметра `leftLabel`:

**[Посмотреть в Playground](./tumbler-playground.story.vue?variantId=left-label)**

```vue
<TNTumbler label="Тумблер" left-label></TNTumbler>
```

## Параметры (props)

| Название    | Тип            | Обязательность                  | Комментарий                                                  |
|-------------|----------------|---------------------------------|--------------------------------------------------------------|
| disabled    | `boolean`      | &cross;                         | Отключение элемента                                          |
| block       | `boolean`      | &cross;                         | Элемент на всю ширину                                        |
| size        | `"md" \| "lg"` | &cross; (по-умолчанию: `"md"`)  | Размер компонента                                            |
| modelValue  | `boolean`      | &cross;                         | Значение value переменной для компонента                     |
| icon        | `IconNames`    | &cross;                         | Название иконки                                              |
| innerIcon   | `IconNames`    | &cross;                         | Название иконки внутри кружочка                              |
| error       | `string`       | &cross;                         | Текст ошибки (включает «error» стиль у компонента)           |
| warn        | `string`       | &cross;                         | Текст предупреждения (включает «warning» стиль у компонента) |
| label       | `string`       | &cross; (по-умолчанию: `""`)    | Текст заголовка компонента                                   |
| description | `string`       | &cross;                         | Текст описания компонента                                    |
| leftLabel   | `boolean`      | &cross; (по-умолчанию: `false`) | Расположение лейбла слева от компонента                      |

## События (emits)

| Событие           | Возвращаемые данные    | Комментарий                                  |
|-------------------|------------------------|----------------------------------------------|
| update:modelValue | modelValue (`Boolean`) | Событие вызывается при обновлении modelValue |

## Слоты

| Слот      | Описание                                  | Scoped Slot |
|-----------|-------------------------------------------|-------------|
| label     | Слот для кастомного названия              | —           |
| icon      | Слот для кастомной иконки                 | —           |
| innerIcon | Слот для кастомной иконки внутри кружочка | —           |
