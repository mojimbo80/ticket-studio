import type { Ticket } from '@ticket-studio/shared';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SCENARIO_PARTS = [
  { key: 'given', label: 'Given', placeholder: 'La situation de départ' },
  { key: 'when', label: 'When', placeholder: "L'action de l'utilisateur" },
  { key: 'then', label: 'Then', placeholder: 'Le résultat attendu' },
] as const;

interface ScenarioFieldsetProps {
  form: UseFormReturn<Ticket>;
  index: number;
  onRemove: () => void;
}

// Un scénario Given / When / Then avec sa suppression.
export function ScenarioFieldset({ form, index, onRemove }: ScenarioFieldsetProps) {
  const errors = form.formState.errors.scenarios?.[index];

  return (
    <fieldset className="flex flex-col gap-2.5 rounded-[10px] border p-4">
      <legend className="px-1.5 text-xs font-medium text-muted-foreground">
        Scénario {index + 1}
      </legend>

      {SCENARIO_PARTS.map((part) => {
        const error = errors?.[part.key]?.message;
        return (
          <div key={part.key} className="flex flex-col gap-1">
            <label className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
              <span className="font-mono text-[13px] font-medium">{part.label}</span>
              <Input
                placeholder={part.placeholder}
                aria-invalid={error ? true : undefined}
                {...form.register(`scenarios.${index}.${part.key}`)}
              />
            </label>
            {error && <p className="pl-[76px] text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <Button type="button" variant="ghost" size="sm" className="self-end" onClick={onRemove}>
        Supprimer ce scénario
      </Button>
    </fieldset>
  );
}
