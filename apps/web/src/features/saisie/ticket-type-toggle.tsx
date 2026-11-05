import { type Ticket, TicketTypeSchema } from '@ticket-studio/shared';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const TICKET_TYPE_OPTIONS = [
  { value: 'story', label: 'User story' },
  { value: 'bug', label: 'Bug' },
  { value: 'tech', label: 'Technique' },
] as const;

interface TicketTypeToggleProps {
  form: UseFormReturn<Ticket>;
}

export function TicketTypeToggle({ form }: TicketTypeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <span id="ticket-type-label" className="text-sm font-medium">
        Type de ticket
      </span>
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <ToggleGroup
            aria-labelledby="ticket-type-label"
            value={[field.value]}
            onValueChange={(next) => {
              // Cliquer sur le type déjà choisi ne doit pas le désélectionner.
              const choice = TicketTypeSchema.safeParse(next.at(-1));
              if (choice.success) {
                field.onChange(choice.data);
              }
            }}
            variant="outline"
          >
            {TICKET_TYPE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
    </div>
  );
}
