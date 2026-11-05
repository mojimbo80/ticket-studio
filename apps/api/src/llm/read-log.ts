// Journal des fichiers lus pendant une requête : permet de vérifier que chaque source citée a bien été lue.
export class ReadLog {
  private readonly paths = new Set<string>();

  record(relativePath: string): void {
    this.paths.add(relativePath);
  }

  list(): string[] {
    return [...this.paths].sort();
  }
}
