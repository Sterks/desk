---
title: TNTree/Doc
group: form
---

# Дерево

## Использование

Для подготовки списка дерева, чтобы правильно отрабатывали взаимодействия с вложенностью,
необходимо будет пропустить список через встроенный метод `getOptionsTree`.

```js
import { getOptionsTree } from "@life_uikit/uikit";

onMounted(() => {
  tree.value = tree.value.map(ti => getOptionsTree(ti));
});
```

### Стилизация

Аттрибут `simple` изменяет стилизацию элемента при выборе.

Свойство элемента `iconButton: string` позволяет вставить кнопку на элемент,
при нажатии на который будет вызвано событие `iconButtonClick`

### isAsync

Если вложенность списка не известна заранее и вложенный список будет
получен с помощью асинхронного запроса, то нужно передать
prop `isAsync` и emit `loadOptions` для загрузки данных,
функция может принять один аргумент - тот пункт для которого нужно загрузить данные.

`v-model` будет изменен с задержкой, после загрузки всех дочерних элементов если они есть

**[Посмотреть в Playground](./tree-async.story.vue?variantId=async)**

```vue
<TNTree
  v-model="asyncValue"
  :options="treeAsync"
  is-async
  @loadOptions="loadOptions"
  @update:modelValue="updateAsyncValueHandler"
/>
```

### Блокировка элемента

Свойства `disabled` и `disableSelect` позволяют управлять блокировкой элементами дерева.
`disable` запрещает выбирать всю ветку, `disableSelect` только родителя

**[Посмотреть в Playground](./tree-disable.story.vue?variantId=disabled)**

```vue
<TNTree
  v-model="parentValue"
  :options="demoTreeDisable"
  :is-depends-parent="false"
/>
```

```js
const demoTreeDisable = [
  {
    id: 1,
    deep: 0,
    title: "Категория 1",
    isCheck: false,
    isLoad: false,
    isOpen: false,
    disabled: true,
    children: []
  },
  {
    id: 2,
    deep: 0,
    title: "Категория 2",
    isCheck: false,
    isOpen: false,
    isLoad: false,
    disableSelect: true,
    children: []
  }
];
```

### Авто-выбор родителя

По умолчанию если хотя бы один дочерний элемент не выбран, то родитель тоже будет не выбран.  
Чтобы отключить эту возможность для всех элементов, прокиньте prop `isDependsParent` или же для отдельного элемента (родителя) установите параметр `isDependsParent`

### Тип TNTreeProps.Option

```typescript
export namespace TNTreeProps {
  export type Option = {
    // Идентификатор
    id: string | number;
    // Ссылка на родительский элемент
    parent?: Option;
    // Название
    title: string;
    // Выбран ли пункт
    isCheck: boolean;
    // Развёрнут ли пункт
    isOpen?: boolean;
    // Состояние загрузки пункта
    isLoad?: boolean;
    // Блокирует элемент, его невозможно выбрать и открыть дочерние элементы
    disabled?: boolean;
    // Блокирует выбор родительского элемента, открывать и выбирать дочерние элементы остается возможным
    disableSelect?: boolean;
    // Уровень вложенности
    deep: number;
    // Список вложенных пунктов
    children?: Option[];
    // Если нужно данный пункт оставлять выбранным, даже если не выбраны его дочерние элементы
    isDependsParent?: boolean;
    // Иконка действия, которая будет вызывать событие iconButtonClick
    iconButton?: IconNames;
  };
}
```

## Параметры (props)

| Название             | Тип                       | Обязательность                 | Комментарий                                                                           |
|----------------------|---------------------------|--------------------------------|---------------------------------------------------------------------------------------|
| modelValue           | `Array<string \| number>` | &check;                        | Значение value переменной для компонента                                              |
| options              | `TNTreeProps.Option[]`    | &cross; (по-умолчанию: `[]`)   | Массив опций для дерева                                                               |
| isAsync              | `boolean`                 | &cross;                        | Асинхронное дерево                                                                    |
| isDependsParent      | `boolean`                 | &cross; (по-умолчанию: `true`) | Авто-выбор родителя                                                                   |
| multiple             | `boolean`                 | &cross; (по-умолчанию: `true`) | Опредеяет можно ли выбрать несколько элементов дерерва                                |
| childRecursiveSelect | `boolean`                 | &cross; (по-умолчанию: `true`) | При true, выбор родительского элемента автоматически выберет все дочерние элементы    |
| simple               | `boolean`                 | &cross;                        | Изменяет стиль заголовка элемента, когда элемент выбран                               |
| highlightDisable     | `boolean`                 | &cross;                        | Изменяет стиль заголовка элемента, когда элемент отключен или выбор элемента отключен |

## События (emits)

| Событие           | Возвращаемые данные                    | Комментарий                                         |
|-------------------|----------------------------------------|-----------------------------------------------------|
| loadOptions       | option (`TNTreeProps.Option`)          | Событие вызывается при открытии асинхронного дерева |
| update:modelValue | modelValue (`Array<string \| number>`) | Событие вызывается при обновлении modelValue        |
| iconButtonClick   | optionId (`string \| number`)          | Событие вызывается при клике на иконку              |

## Слоты

**Слотов нет**
