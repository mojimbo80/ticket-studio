import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface CopyMarkdownButtonProps {
  markdown: string;
}

// Copie le ticket en Markdown dans le presse-papiers, avec une confirmation.
export function CopyMarkdownButton({ markdown }: CopyMarkdownButtonProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Ticket copié en Markdown');
    } catch {
      toast.error('Copie impossible : le presse-papiers n’est pas accessible.');
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={() => void copy()}>
      <Copy aria-hidden="true" />
      Copier en Markdown
    </Button>
  );
}
