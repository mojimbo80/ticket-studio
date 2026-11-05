const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCommitDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
