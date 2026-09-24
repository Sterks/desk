export interface LatestGuard {
  /** Начать запрос. Возвращённая функция отвечает, остался ли он последним к моменту ответа. */
  begin(): () => boolean;
  /** Объявить устаревшими все запросы, начатые до этого момента (например, после записи на сервер). */
  invalidate(): void;
}

/**
 * Монотонный счётчик запросов: ответ применяется, только если после его запроса не начался другой
 * и не было invalidate(). Замена флага `alive` из React-версии TaskPanel (useEffect-cleanup).
 */
export function createLatestGuard(): LatestGuard {
  let seq = 0;
  return {
    begin() {
      const mine = ++seq;
      return () => mine === seq;
    },
    invalidate() {
      seq += 1;
    },
  };
}
