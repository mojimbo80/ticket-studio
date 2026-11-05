import { BookOpen, Send } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { applyTicketPatch, describePatch } from './apply-patch';
import { type ChatTurn, useChatStore } from './chat-store';
import { useChatStream } from './use-chat-stream';

interface ConversationPanelProps {
  // Demande pré-remplie (venant d'une recommandation du diagnostic).
  initialDraft: string;
}

// Conversation avec l'agent : historique, références, réponses rapides et modifications proposées.
export function ConversationPanel({ initialDraft }: ConversationPanelProps) {
  const turns = useChatStore((state) => state.turns);
  const { send, status, progress, error } = useChatStream();
  const [draft, setDraft] = useState(initialDraft);
  const busy = status === 'streaming';

  const submit = (text: string) => {
    setDraft('');
    void send(text);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4" aria-live="polite">
        {turns.length === 0 && (
          <p className="text-muted-foreground">
            Pose une question sur le ticket, ou demande une modification.
          </p>
        )}

        {turns.map((turn) => (
          <TurnView key={turn.id} turn={turn} disabled={busy} onQuickReply={submit} />
        ))}

        {busy && progress && <p className="text-sm text-muted-foreground">{progress}</p>}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim() !== '' && !busy) {
            submit(draft);
          }
        }}
      >
        <Textarea
          aria-label="Message à l’agent"
          placeholder="Demande une modification : « ajoute un cas d’erreur »…"
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Envoyer"
          disabled={busy || draft.trim() === ''}
        >
          <Send aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}

interface TurnViewProps {
  turn: ChatTurn;
  disabled: boolean;
  onQuickReply: (text: string) => void;
}

function TurnView({ turn, disabled, onQuickReply }: TurnViewProps) {
  const setPatchStatus = useChatStore((state) => state.setPatchStatus);

  if (turn.role === 'user') {
    return (
      <div className="ml-auto max-w-[85%] rounded-[12px] bg-foreground px-4 py-2.5 text-sm text-background">
        {turn.text}
      </div>
    );
  }

  return (
    <div className="flex max-w-[90%] flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-[12px] border bg-background px-4 py-3 text-sm">
        <p>{turn.text}</p>
        {turn.references.map((reference) => (
          <span key={reference.label} className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span className="font-medium">Repéré dans</span> · {reference.label}
          </span>
        ))}
      </div>

      {turn.quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {turn.quickReplies.map((reply) => (
            <Button
              key={reply}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onQuickReply(reply)}
            >
              {reply}
            </Button>
          ))}
        </div>
      )}

      {turn.patch && (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-[12px] border p-4 text-sm',
            turn.patch.status === 'pending' ? 'border-foreground' : 'bg-muted/40',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{describePatch(turn.patch.value).title}</span>
            <Badge variant="outline">
              {turn.patch.status === 'pending' && 'Proposition'}
              {turn.patch.status === 'applied' && 'Appliqué'}
              {turn.patch.status === 'ignored' && 'Ignoré'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{describePatch(turn.patch.value).detail}</p>
          {turn.patch.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  applyTicketPatch(turn.patch!.value);
                  setPatchStatus(turn.id, 'applied');
                }}
              >
                Appliquer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPatchStatus(turn.id, 'ignored')}>
                Ignorer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
