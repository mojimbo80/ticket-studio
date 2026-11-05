// Erreur attendue, dont le message peut être affiché à l'utilisateur.
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
