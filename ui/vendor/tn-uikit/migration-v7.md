# Миграция на 7.0.0

Седьмая версия — это рефакторинг структуры пакета и перевод всех компонентов на TypeScript.
Внешний вид и поведение компонентов сохранены, меняются пути импорта, часть параметров и типы.

Полный список изменений — в [Changelog.md](./Changelog.md).

## Порядок работ

1. Обновите пакет и проверьте зависимости — [Шаг 1](#шаг-1-зависимости).
2. Подключите ESLint-плагин и прогоните автофикс — он закрывает большую часть правок в шаблонах ([Шаг 2](#шаг-2-автофикс-параметров)).
3. Поправьте пути импорта — [Шаг 3](#шаг-3-пути-импорта).
4. Запустите сборку и проверку типов, дальше идите по разделам ниже: они разобраны по компонентам.

## Шаг 1. Зависимости

Минимальная версия Vue поднята до `3.3`.

`vue-router` переехал из обязательных зависимостей в опциональные. Он нужен только для
`TNBreadcrumbs` с параметром `to`: если вы ставите зависимости с `--omit=optional`
и пользуетесь хлебными крошками — добавьте `vue-router` в свой `package.json` явно.

Точка входа пакета переведена на TypeScript: в `package.json` теперь `"main": "index.ts"`.
Сборщик проекта должен транспилировать содержимое `node_modules/@life_uikit/uikit`.
Vite делает это без настройки. Если у вас свой webpack-конфиг с `exclude: /node_modules/`
у `ts-loader`/`babel-loader` или пакет попал в `optimizeDeps.exclude` — исключение нужно снять.

## Шаг 2. Автофикс параметров

В пакет входит ESLint-плагин, который знает об устаревших параметрах и умеет их чинить.
Подключение описано в [README](./README.md#eslint-плагин), после этого:

```shell
npx eslint . --fix
```

Автофикс закрывает:

- стилевые параметры `TNButton` → `type` (Шаг 4);
- `soft` у `TNTabs` → `type="soft"` (Шаг 5);
- удаление `mobileBreakPoint` у всех компонентов (Шаг 6).

Плагин не чинит молча спорные случаи и оставляет их предупреждением:

- значение динамическое (`:action="isPrimary"`) — какой `type` подставить, в статике неизвестно;
- конфликт (`<TNButton action outline>` или уже заданный `type`) — победитель неочевиден.

Остальные пункты этой инструкции автофикс не покрывает — их нужно пройти руками.

## Шаг 3. Пути импорта

Компоненты переехали в `components/<name>/`, `interfaces.ts` разобран на `types/index.ts`
и пофайловые `<component>.types.ts`. Публичные типы, composables и хелперы
реэкспортируются из корня пакета, поэтому в большинстве случаев достаточно импортировать
всё оттуда.

| Было                                   | Стало                                 |
|----------------------------------------|---------------------------------------|
| `@life_uikit/uikit/interfaces`         | `@life_uikit/uikit`                   |
| `@life_uikit/uikit/icons/icon-names`   | `@life_uikit/uikit`                   |
| `@life_uikit/uikit/toaster/composable` | `@life_uikit/uikit`                   |
| `@life_uikit/uikit/button/button.vue`  | `@life_uikit/uikit/components/button` |
| `@life_uikit/uikit/<name>/<name>.vue`  | `@life_uikit/uikit/components/<name>` |
| `@life_uikit/uikit/popup/popup.css`    | файла нет, стили внутри компонента    |
| `@life_uikit/uikit/tree/tree.css`      | файла нет, стили внутри компонента    |

Корневые css-файлы (`variables.css`, `variables-dark.css`, `fonts.css`, `app.css`)
остались на своих местах.

## Шаг 4. `TNButton`

Булевы параметры внешнего вида свёрнуты в один `type`:

| Было        | Стало            |
|-------------|------------------|
| `action`    | `type="action"`  |
| `secondary` | `type="default"` |
| `outline`   | `type="outline"` |
| `white`     | `type="white"`   |
| `link`      | `type="link"`    |

Значение по умолчанию — `type="action"`, как и раньше.

```vue
<!-- было -->
<TNButton secondary>Отмена</TNButton>
<!-- стало -->
<TNButton type="default">Отмена</TNButton>
```

Отдельно: кнопка больше не использует `vue-router`. Параметр `norouter` удалён,
и любой `href` теперь открывается через `window.location` / `window.open`.
Раньше `href` без `norouter` уходил в `router.push()`, то есть был SPA-переходом
без перезагрузки страницы.

Автофикс здесь не поможет и ESLint об этом не предупредит — найдите все `<TNButton :href>`,
которые вели на внутренние маршруты, и перепишите их:

```vue
<!-- было: SPA-переход -->
<TNButton href="/profile">Профиль</TNButton>

<!-- стало -->
<TNButton @click="router.push('/profile')">Профиль</TNButton>
<!-- или -->
<router-link to="/profile" custom v-slot="{ navigate }">
  <TNButton @click="navigate">Профиль</TNButton>
</router-link>
```

Внешние ссылки (`href` на другой домен, `target="_blank"`) работают как раньше.

## Шаг 5. `TNTabs`

Параметр `soft` свёрнут в `type`:

```vue
<!-- было -->
<TNTabs soft :options="options" />
<!-- стало -->
<TNTabs type="soft" :options="options" />
```

Изменилось значение `modelValue` по умолчанию: было `0`, стало `undefined`.
Если у вас есть таб с `id: 0` и пустым начальным значением `v-model`, он больше
не будет выбран автоматически — задайте начальное значение явно.

## Шаг 6. Параметр `mobileBreakPoint`

Удалён у `TNSelector`, `TNMultiSelector`, `TNScrollSelect`, `TNDatepicker`,
`TNRangeDatepicker`, `TNSearch`, `TNDropdown`, `TNBottomSheet`. Точка перехода
на мобильный вид задаётся один раз при установке плагина:

```ts
app.use(TNLifeUIKit, { mobileBreakPoint: 768 });
```

Автофикс только удаляет параметр из шаблона — если у вас были нестандартные значения,
перенесите их в опции плагина самостоятельно.

Раньше параметр имел собственное значение по умолчанию `768`, поэтому компонент,
импортированный напрямую без `app.use(TNLifeUIKit)`, всё равно умел переключаться
в мобильный вид. Теперь без установленного плагина такие компоненты всегда десктопные.

## Шаг 7. `TNRadio` и `TNCheckbox`

У `TNRadio` параметр `summaryValue` переименован в `modelValue` и добавлено событие
`update:modelValue` — компонент работает через `v-model`. Событие `input` сохранено
с прежней сигнатурой.

```vue
<!-- было -->
<TNRadio :item-value="1" :summary-value="selected" @input="selected = $event" />
<!-- стало -->
<TNRadio v-model="selected" :item-value="1" />
```

У `TNCheckbox` удалён параметр `itemValue` — он ни на что не влиял.
Уберите его из шаблонов, поведение не изменится.

## Шаг 8. `TNCell`

Признак верификации переехал внутрь `chat`. Это изменение поведения, а не только типов:
со старой структурой галочка просто перестанет отображаться.

```ts
// было
{ id, title, verified: true, chat: { … } }
// стало
{ id, title, chat: { …, verified: true } }
```

Остальные поля `chat` (`time`, `status`, `pinned`, `notification`, `body`, `muted`)
стали необязательными.

## Шаг 9. `TNRangeDatepicker`

- Параметр `time` удалён — выбор времени в диапазонном пикере больше не поддерживается.
  Если он был нужен, используйте два `TNDatepicker` с `time`.
- Параметр `alwaysBottom` удалён — положение окна задаётся через `position`, `flip` и `shift`.
- `modelValue` стал кортежем `[Date | undefined, Date | undefined]` вместо `Date[]`.
  Массив произвольной длины больше не проходит проверку типов.

## Шаг 10. `TNTable`

`TNTable.Value` стал размеченным объединением: набор полей ячейки зависит от её `type`.
Раньше объектная форма значения была одним типом со всеми полями необязательными,
поэтому компилировалось что угодно.

| `type`                 | Допустимые поля                                                           |
|------------------------|---------------------------------------------------------------------------|
| `DataType.Text`        | `value?`, `copyable?`, `tooltip?`                                         |
| `DataType.Tag`         | `value`, `label?`, `icon?`, `iconColor?`, `rightIcon?`, `rightIconColor?` |
| `DataType.Link`        | `value`, `label?`                                                         |
| `DataType.UserPicture` | `imageUrl?`, `value?`, `icon?`, `iconColor?`, `iconSecondaryColor?`       |
| `DataType.Component`   | `component`, `bind?`, `events?`                                           |

Заодно ужесточились типы у `DataType.Component`: `bind` теперь `Record<string, unknown>`,
`events` — `Record<string, (...args: unknown[]) => void>`.

Лишние поля (например `icon` у текстовой ячейки) раньше молча игнорировались —
проверка типов покажет все такие места, их достаточно удалить.

## Шаг 11. Типы

| Тип                                                                                                                             | Что делать                                                                                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ITNSearchResult`                                                                                                               | Описывает **один элемент** результата, а не весь массив. Параметр `result` у `TNSearch` теперь `ITNSearchResult[]` и не принимает `null` — замените на `undefined` или `[]`. |
| `ITNFloatingButton["props"]`                                                                                                    | Это пропсы `TNButton`, поэтому `action`, `white`, `secondary`, `outline`, `link`, `norouter` в нём больше не валидны — переведите на `type` (Шаг 4).                         |
| `ITNToast`                                                                                                                      | `text` принимает `string \| VNode`; коллбеки описаны как `() => void` вместо `Function`.                                                                                     |
| `ITNToastOptions["toast"]`                                                                                                      | Поле `creationTime` больше нельзя передавать — `useToaster` всегда проставляет текущее время сам.                                                                            |
| `ITNCheckboxRadioGroupOption`                                                                                                   | `itemValue` стал дженериком (`string \| number \| boolean`).                                                                                                                 |
| `TNCheckboxRadioGroupProps`                                                                                                     | Тип значения зависит от `type`: при `radio` — одиночное значение, при `checkbox` — массив. Код с `type="radio"` и массивом в `modelValue` перестанет компилироваться.        |
| `ITNPopoverArrowPosition`                                                                                                       | Было `"auto" & ITNPopoverPosition` (фактически `never`), стало объединением. Обходные `as any` можно снимать.                                                                |
| `extendedExtensions` у `TNFileIcon`                                                                                             | Больше не принимает `null` — уберите явную передачу или передайте `undefined`.                                                                                               |
| `borderRadius` у `TNFloatingButtons`                                                                                            | Принимает число или строку-число (`"16"`). Значения вида `"16px"` не пройдут — раньше они превращались в некорректный `"16pxpx"`.                                            |
| `TNTreeProps.Option`, `TNTabsOption`, `ITNDropdownMenu`, `ITNMenuItem`, `TNScrollSelectOption`, `ICellDataItem`, `TNTable.Data` | Стали дженериками по типу идентификатора. Значения по умолчанию сохраняют совместимость, но при неоднородных `id` вывод типов строже.                                        |

## Шаг 12. Обязательные параметры

Раньше были необязательными, теперь обязательны — рантайм не меняется,
но проверка типов упадёт:

- `isOpen` у `TNBottomSheet`;
- `visible` у `TNPopover`.

## Шаг 13. Имена иконок

Скрипт обновления списка иконок заменён на команду пакета:

```shell
npx @life_uikit/uikit sync-icons
```

Она же висит на `postinstall`, так что после `npm ci` список пересобирается сам.
Хук `"scripts": { "install": "npm explore @life_uikit/uikit -- npm run update-icon-names" }`
из своего `package.json` нужно убрать — он больше не резолвится.

Список проектных иконок задаётся как раньше:

```json
{
  "tn-ui-kit": {
    "external-icon-names": ["new-icon-name"]
  }
}
```

## Шаг 14. `TransitionCollapse`

Компонент по-прежнему не регистрируется глобально, но теперь экспортируется из корня пакета,
а не импортируется по пути файла:

```ts
// было
import TransitionCollapse from "@life_uikit/uikit/transitions/transition-collapse.vue";
// стало
import { TransitionCollapse } from "@life_uikit/uikit";
```

## Чеклист

- [ ] Vue обновлён до `3.3+`, сборщик транспилирует пакет
- [ ] ESLint-плагин подключён, `eslint . --fix` прогнан, оставшиеся предупреждения разобраны
- [ ] Пути импорта поправлены, `interfaces` и css-файлы компонентов больше не импортируются
- [ ] `<TNButton :href>` на внутренние маршруты переведены на роутер
- [ ] `mobileBreakPoint` перенесён в опции плагина
- [ ] `summaryValue` у `TNRadio` переименован
- [ ] `verified` у `TNCell` перенесён в `chat`
- [ ] Значения `TNTable` приведены к нужному `type`
- [ ] `npm run type-check` (или сборка) проходит без ошибок
