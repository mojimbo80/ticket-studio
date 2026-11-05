import type { Ticket } from '@ticket-studio/shared';
import { Plus, X } from 'lucide-react';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinksFieldProps {
  form: UseFormReturn<Ticket>;
}

// Liste d'URL (maquette, ticket lié, document) : une ligne par lien.
export function LinksField({ form }: LinksFieldProps) {
  const links = useWatch({ control: form.control, name: 'links' });
  const errors = form.formState.errors.links;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Liens</span>

      {links.map((_, index) => {
        const error = errors?.[index]?.message;
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://… (maquette, ticket lié, document)"
                aria-label={`Lien ${index + 1}`}
                aria-invalid={error ? true : undefined}
                {...form.register(`links.${index}`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Retirer le lien ${index + 1}`}
                onClick={() =>
                  form.setValue(
                    'links',
                    links.filter((_, position) => position !== index),
                  )
                }
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => form.setValue('links', [...links, ''])}
      >
        <Plus aria-hidden="true" />
        Ajouter un lien
      </Button>
    </div>
  );
}
