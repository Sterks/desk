/** kind "to-enum": булев параметр схлопнут в enum-параметр. */
export interface PropToEnum {
  kind: "to-enum";
  /** Имя нового enum-параметра (например, "type"). */
  prop: string;
  /** Значение нового параметра (например, "action"). */
  value: string;
  /** Версия uikit, с которой параметр устарел. */
  since?: string;
}

/** kind "remove": параметр удалён из компонента, автофикс убирает атрибут целиком. */
export interface PropRemove {
  kind: "remove";
  /** Подсказка, что делать вместо него (попадёт в текст предупреждения). */
  hint?: string;
  /** Версия uikit, с которой параметр удалён. */
  since?: string;
}

/** kind "rename": параметр переименован, автофикс меняет только имя (значение сохраняется). */
export interface PropRename {
  kind: "rename";
  /** Новое имя параметра (например, "maxMobileWidth"). */
  to: string;
  /** Версия uikit, с которой параметр переименован. */
  since?: string;
}

/** kind "value-map": устарели конкретные значения параметра, имя остаётся. */
export interface PropValueMap {
  kind: "value-map";
  /** Карта «старое значение -> новое»; автофикс заменяет статически известные значения. */
  map: Record<string, string>;
  /** Версия uikit, с которой значения устарели. */
  since?: string;
}

export type PropDeprecation = PropToEnum | PropRemove | PropRename | PropValueMap;

/** Описание миграции одного компонента. */
export interface Migration {
  /** Имя компонента как в шаблоне (например, "TNButton"). */
  component: string;
  /** Устаревшие параметры: имя пропа -> описание. */
  props: Record<string, PropDeprecation>;
}

export function defineMigration(migration: Migration): Migration;
