import type { ICellDataItem } from "../cell/cell.types";

export type ITNSearchResult = ICellDataItem | { title: string; id: string } | string;
