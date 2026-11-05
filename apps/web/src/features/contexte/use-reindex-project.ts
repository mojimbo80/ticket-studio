import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { queryKeys } from '@/queries/keys';
import { reindexProjectMutationOptions } from '@/queries/project';

// « Ré-analyser » : resynchronise le dépôt, puis invalide le contexte pour le recharger.
export function useReindexProject() {
  const queryClient = useQueryClient();

  return useMutation({
    ...reindexProjectMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.project.context() });
      toast.success('Analyse mise à jour');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
