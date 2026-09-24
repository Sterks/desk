import { onMounted, ref, type Ref } from 'vue';
import { api } from '../api/client';
import type { ProjectInfo } from '../api/types';

/**
 * Проект из `.desk/project.yaml` для шапки. Только отображение: без переключателя проектов
 * (одна доска на проект). Legacy-проект (без project.yaml) и ошибка загрузки — `null`:
 * имя проекта необязательно, а сбой связи с сервером и так показывает баннер useBoardData.
 */
export function useProject(): Ref<ProjectInfo | null> {
  const project = ref<ProjectInfo | null>(null);
  onMounted(() => {
    api.project().then(
      (info) => {
        project.value = info.legacy ? null : info;
      },
      () => {
        project.value = null;
      },
    );
  });
  return project;
}
