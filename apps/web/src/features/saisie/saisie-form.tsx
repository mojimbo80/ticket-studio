import { zodResolver } from '@hookform/resolvers/zod';
import { type Ticket, TicketSchema } from '@ticket-studio/shared';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { LinksField } from './links-field';
import { ScenarioFieldset } from './scenario-fieldset';
import { TicketTypeToggle } from './ticket-type-toggle';
import { useTicketStore } from './ticket-store';

export const SAISIE_FORM_ID = 'ticket-form';

const EMPTY_SCENARIO = { given: '', when: '', then: '' };

// Formulaire du ticket. Chaque modification est copiée dans le store, puis « Lancer le diagnostic » valide et navigue.
export function SaisieForm() {
  const navigate = useNavigate();
  const setTicket = useTicketStore((state) => state.setTicket);

  const form = useForm<Ticket>({
    resolver: zodResolver(TicketSchema),
    defaultValues: useTicketStore.getState().ticket,
  });
  const scenarios = useFieldArray({ control: form.control, name: 'scenarios' });
  const liveValues = useWatch({ control: form.control });
  const titleEmpty = (liveValues.title ?? '').trim() === '';

  useEffect(() => {
    setTicket(form.getValues());
  }, [liveValues, form, setTicket]);

  const onSubmit = (ticket: Ticket) => {
    setTicket(ticket);
    void navigate({ to: '/analyse' });
  };

  return (
    <form
      id={SAISIE_FORM_ID}
      onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      className="flex min-w-0 flex-[999_1_620px] flex-col gap-6 rounded-[14px] border p-6 shadow-xs"
    >
      <TicketTypeToggle form={form} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="ticket-title">
          Titre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ticket-title"
          placeholder="Ex. : Permettre aux clients d'archiver leurs commandes terminées"
          aria-required="true"
          aria-invalid={titleEmpty || undefined}
          className="h-10 text-[15px]"
          {...form.register('title')}
        />
        {titleEmpty ? (
          <p className="text-sm text-destructive">
            Le titre est nécessaire pour lancer le diagnostic.
          </p>
        ) : (
          form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )
        )}
        <p className="text-sm text-muted-foreground">
          Une phrase claire, du point de vue de l'utilisateur.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="ticket-context">Contexte</Label>
        <Textarea
          id="ticket-context"
          rows={3}
          placeholder="Quel problème rencontrent les utilisateurs ? D'où vient la demande ?"
          {...form.register('context')}
        />
        <p className="text-sm text-muted-foreground">
          Le pourquoi : le problème et ce qu'on y gagne.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ticket-description">Description</Label>
        <Textarea
          id="ticket-description"
          rows={3}
          placeholder="En tant que [utilisateur], je veux [action] afin de [bénéfice]."
          {...form.register('description')}
        />
        <p className="text-sm text-muted-foreground">Le quoi, sous forme de user story.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Critères d'acceptation</span>
          <span className="text-sm text-muted-foreground">
            Given / When / Then : un comportement vérifiable par scénario.
          </span>
        </div>

        {scenarios.fields.map((field, index) => (
          <ScenarioFieldset
            key={field.id}
            form={form}
            index={index}
            onRemove={() => scenarios.remove(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => scenarios.append(EMPTY_SCENARIO)}
        >
          <Plus aria-hidden="true" />
          Ajouter un scénario
        </Button>
      </div>

      <LinksField form={form} />
    </form>
  );
}
