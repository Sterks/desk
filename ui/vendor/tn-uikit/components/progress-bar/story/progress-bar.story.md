---
title: TNProgressBar/Doc
group: data
---

# TNProgressBar

## Описание

Компонент шкалы прогресса (заполняется по делениям)

## Использование

**Использование и вид можно посмотреть в [Playground](./progress-bar-playground.story.vue)**

Параметр `quantity` - количество табов

Компонент может взаимодействовать при помощи `v-model`, если не
нужна никакая обработка события, а также силами параметра
`modelValue` и событием `update:modelValue`

```vue
<TNProgressBar v-model="someVal" :quantity="3" />
```

```vue
<TNProgressBar
  :model-value="someVal"
  :quantity="6"
  @update:modelValue="someFunc"
/>
```

## Параметры (props)

| Название   | Тип                | Обязательность              | Комментарий                              |
|------------|--------------------|-----------------------------|------------------------------------------|
| quantity   | `string \| number` | &cross; (по-умолчанию: `1`) | Количество табов                         |
| modelValue | `string \| number` | &cross; (по-умолчанию: `1`) | Значение value переменной для компонента |

## События (emits)

| Событие           | Возвращаемые данные             | Комментарий                                 |
|-------------------|---------------------------------|---------------------------------------------|
| update:modelValue | modelValue (`string \| number`) | Событие вызывается при изменении modelValue |

## Слоты

**Слотов нет**
