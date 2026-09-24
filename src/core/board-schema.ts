import { z } from 'zod';
import { BUILTIN_FIELDS, FIELD_TYPES, type Board, type FieldDef, type FieldValue } from './types.js';
import { checkValue } from './validate.js';

const ID = z.string().regex(/^[a-z][a-z0-9_]*$/, 'id: латиница в нижнем регистре, цифры и _, начинается с буквы');
const BUILTIN = new Set<string>(BUILTIN_FIELDS);

const columnSchema = z
  .object({
    id: ID,
    title: z.string().min(1).optional(),
    wip_limit: z.number().int().positive().optional(),
    guide: z.string().optional(),
  })
  .strict();

const transitionSchema = z
  .object({
    from: ID,
    to: z.union([ID, z.array(ID).min(1)]),
    requires: z.array(z.string()).optional(),
  })
  .strict();

const fieldSchema = z
  .object({
    id: ID,
    type: z.enum(FIELD_TYPES),
    required: z.boolean().optional(),
    values: z.array(z.string().min(1)).min(1).optional(),
    default: z.unknown().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    guide: z.string().optional(),
  })
  .strict();

type RawField = z.infer<typeof fieldSchema>;

function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function toFieldDef(raw: RawField): FieldDef {
  return omitUndefined({
    id: raw.id,
    type: raw.type,
    required: raw.required ?? false,
    values: raw.values,
    default: raw.default as FieldValue | undefined,
    min: raw.min,
    max: raw.max,
    guide: raw.guide,
  });
}

export const rawBoardSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1).optional(),
    id_prefix: z.string().regex(/^[A-Za-z]+$/, 'id_prefix: только латинские буквы').optional(),
    guide: z.string().optional(),
    columns: z.array(columnSchema).min(1),
    transitions: z.array(transitionSchema).optional(),
    fields: z.array(fieldSchema).optional(),
  })
  .strict()
  .superRefine((b, ctx) => {
    const issue = (path: (string | number)[], message: string): void =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const columnIds = new Set<string>();
    b.columns.forEach((c, i) => {
      if (columnIds.has(c.id)) issue(['columns', i, 'id'], `колонка ${c.id} объявлена дважды`);
      columnIds.add(c.id);
    });

    const fieldIds = new Set<string>();
    (b.fields ?? []).forEach((f, i) => {
      if (BUILTIN.has(f.id)) issue(['fields', i, 'id'], `${f.id} — встроенное поле, его нельзя объявлять`);
      else if (fieldIds.has(f.id)) issue(['fields', i, 'id'], `поле ${f.id} объявлено дважды`);
      fieldIds.add(f.id);

      const needsValues = f.type === 'enum' || f.type === 'multi_enum';
      if (needsValues && !f.values) issue(['fields', i, 'values'], `для типа ${f.type} нужен список values`);
      if (!needsValues && f.values) issue(['fields', i, 'values'], 'values допустим только для enum и multi_enum');
      if (f.values && new Set(f.values).size !== f.values.length) issue(['fields', i, 'values'], 'значения values повторяются');
      if (f.type !== 'number' && f.min !== undefined) issue(['fields', i, 'min'], 'min допустим только для number');
      if (f.type !== 'number' && f.max !== undefined) issue(['fields', i, 'max'], 'max допустим только для number');
      if (f.min !== undefined && f.max !== undefined && f.min > f.max) issue(['fields', i, 'min'], 'min больше max');
      if (f.default !== undefined && (!needsValues || f.values)) {
        try {
          checkValue(toFieldDef(f), f.default);
        } catch (e) {
          issue(['fields', i, 'default'], e instanceof Error ? e.message : String(e));
        }
      }
    });

    (b.transitions ?? []).forEach((t, i) => {
      if (!columnIds.has(t.from)) issue(['transitions', i, 'from'], `колонка ${t.from} не существует`);
      if (Array.isArray(t.to)) {
        t.to.forEach((to, j) => {
          if (!columnIds.has(to)) issue(['transitions', i, 'to', j], `колонка ${to} не существует`);
        });
      } else if (!columnIds.has(t.to)) {
        issue(['transitions', i, 'to'], `колонка ${t.to} не существует`);
      }
      (t.requires ?? []).forEach((r, j) => {
        if (r !== 'assignee' && !fieldIds.has(r)) issue(['transitions', i, 'requires', j], `поле ${r} не объявлено в fields`);
      });
    });
  });

export type RawBoard = z.infer<typeof rawBoardSchema>;

export function toBoard(raw: RawBoard): Board {
  return omitUndefined({
    version: 1 as const,
    name: raw.name ?? 'desk',
    idPrefix: raw.id_prefix ?? 'T',
    guide: raw.guide,
    columns: raw.columns.map((c) =>
      omitUndefined({ id: c.id, title: c.title ?? c.id, wipLimit: c.wip_limit, guide: c.guide }),
    ),
    transitions: raw.transitions
      ? raw.transitions.map((t) => ({
          from: t.from,
          to: Array.isArray(t.to) ? t.to : [t.to],
          requires: t.requires ?? [],
        }))
      : null,
    fields: (raw.fields ?? []).map(toFieldDef),
  });
}
