# ESLint-правила @life_uikit/uikit

Правила для проектов, которые **используют** кит: помечают устаревшие параметры
компонентов после рефакторинга и чинят их автофиксом (`eslint --fix`).
Например, `<TNButton action>` → `<TNButton type="action">`.

Плагин шипается внутри `@life_uikit/uikit`. Нужен `vue-eslint-parser`.
Работает и на flat config (ESLint 9), и на legacy `.eslintrc` (ESLint 8).

## Подключение

### Flat config — `eslint.config.js` (ESLint 9)

```js
import uikit from "@life_uikit/uikit/eslint-plugin/index.js";
import vueParser from "vue-eslint-parser";

export default [
  { files: ["**/*.vue"], languageOptions: { parser: vueParser } },
  uikit.configs["flat/recommended"],
];
```

### Legacy — `.eslintrc.*` (ESLint 8)

```js
// .eslintrc.js
module.exports = {
  parser: "vue-eslint-parser",
  extends: ["plugin:@life_uikit/recommended"],
};
```

Дальше `eslint --fix` переписывает устаревшие параметры автоматически.

## Как написать миграцию

Миграции — это чистые данные, отдельные от кода правил. Когда компонент
отрефакторен, добавляется одна спека.

1. Создать `migrations/<component>.js`:

```js
const { defineMigration } = require("../core/define-migration");

module.exports = defineMigration({
  component: "TNButton", // имя как в шаблоне
  props: {
    // kind "to-enum": булев параметр схлопнут в enum-параметр
    action:    { kind: "to-enum", prop: "type", value: "action",  since: "7.0.0" },
    secondary: { kind: "to-enum", prop: "type", value: "default", since: "7.0.0" },
    // kind "remove": параметр удалён, автофикс убирает атрибут целиком
    mobileBreakPoint: { kind: "remove", since: "7.0.0", hint: "Брейкпоинт задаётся глобально." },
    // kind "rename": параметр переименован, автофикс меняет только имя
    color: { kind: "rename", to: "variant", since: "7.0.0" },
    // kind "value-map": устарели конкретные значения, имя остаётся
    size: { kind: "value-map", map: { big: "large", sm: "small" }, since: "7.0.0" },
  },
});
```

Имена пропов матчатся без учёта регистра и дефисов, поэтому спека
`mobileBreakPoint` покрывает и `mobileBreakPoint`, и `mobile-break-point`,
и `:mobile-break-point`.

2. Добавить спеку в реестр `migrations/index.js`. Один файл миграции — один
   компонент (`migrations/<component>.js`), чтобы его можно было расширять
   другими устаревшими пропами со временем.

### Поведение автофикса (`to-enum`)

| Вход | Результат |
| --- | --- |
| `<TNButton action>` | `type="action"` — фикс |
| `<TNButton :action="true">` | `type="action"` — фикс |
| `<TNButton :action="cond">` | warn без фикса (значение динамическое) |
| `<TNButton action outline>` | warn без фикса (неоднозначно, какой стиль) |
| `<TNButton action type="link">` | warn без фикса (`type` уже задан) |

### Поведение автофикса (`remove`)

| Вход | Результат |
| --- | --- |
| `<TNSelector mobileBreakPoint="768" label="A" />` | `<TNSelector label="A" />` — фикс |
| `<TNSelector :mobile-break-point="bp" />` | атрибут удаляется (значение не важно) |
| `<TNSelector mobile-break-point />` | атрибут удаляется |

Параметр удалён из компонента, поэтому фикс безопасен при любом значении —
атрибут просто вырезается вместе с ведущим пробелом.

### Поведение автофикса (`rename`)

Меняется только имя; значение и способ передачи (`:foo`/`v-bind:foo`) сохраняются.

| Вход (`color` → `variant`) | Результат |
| --- | --- |
| `<TNFoo color="red" />` | `<TNFoo variant="red" />` — фикс |
| `<TNFoo :color="c" />` | `<TNFoo :variant="c" />` — фикс |
| `<tn-foo color />` | `<tn-foo variant />` — фикс |
| `<TNFoo color="red" variant="x" />` | warn без фикса (`variant` уже задан) |
| `<TNFoo :[dynamic]="c" />` | warn без фикса (динамический аргумент) |

### Поведение автофикса (`value-map`)

Меняется только значение и только когда оно статически известно и есть в карте.

| Вход (`{ big: "large" }`) | Результат |
| --- | --- |
| `<TNFoo size="big" />` | `<TNFoo size="large" />` — фикс |
| `<TNFoo :size="'big'" />` | `<TNFoo :size="'large'" />` — фикс |
| `<TNFoo :size="cond" />` | warn без фикса (значение динамическое) |
| `<TNFoo size="other" />` | без предупреждения (значения нет в карте) |

## Архитектура

Правило собрано из независимых по `kind` хендлеров:

```
core/
  define-migration.js/.d.ts  — тип спеки миграции + хелпер defineMigration
  ast.js                     — normalizeName, normalizeProp, readAttr
  registry.js                — сборка реестра byComponent из миграций
rules/
  migrate-props.js           — оболочка: обход элементов + диспетчер по kind
  handlers/
    index.js                 — список хендлеров
    to-enum.js remove.js rename.js value-map.js
```

Каждый хендлер экспортирует `{ kind, messages, report(items, shared) }`: оболочка
сливает `messages` в `meta` правила и раскидывает найденные на элементе пропы по
`kind`. `shared` — общий контекст элемента: `{ context, node, sourceCode, present,
presentNorm }`.

**Как добавить новый вид миграции:**

1. Описать его в `core/define-migration.d.ts` новым членом юниона `PropDeprecation`.
2. Создать `rules/handlers/<kind>.js` со своими сообщениями, логикой отчёта и фикса.
3. Дописать его в `rules/handlers/index.js`.

Ядро (`migrate-props.js`) при этом не меняется.