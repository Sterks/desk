import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ProjectInfo } from '../api/types';

/**
 * Проект из `.desk/project.yaml` для шапки. Только отображение: без переключателя проектов
 * (одна доска на проект). Legacy-проект (без project.yaml) и ошибка загрузки — `null`:
 * имя проекта необязательно, а сбой связи с сервером и так показывает баннер useBoardData.
 */
export function useProject(): ProjectInfo | null {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  useEffect(() => {
    let alive = true;
    api.project().then(
      (info) => {
        if (alive) setProject(info.legacy ? null : info);
      },
      () => {
        if (alive) setProject(null);
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return project;
}
