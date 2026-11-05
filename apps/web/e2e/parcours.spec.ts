import { expect, test } from '@playwright/test';
import { mockApi } from './mocks';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('parcours complet : saisie, analyse, diagnostic, atelier et copie', async ({ page }) => {
  await mockApi(page);

  // La racine redirige vers la saisie.
  await page.goto('/');
  await expect(page).toHaveURL(/\/saisie$/);

  // Le titre est obligatoire : le bouton reste désactivé tant qu'il est vide.
  const launch = page.getByRole('button', { name: 'Lancer le diagnostic' });
  await expect(launch).toBeDisabled();
  await expect(page.getByText('Le titre est nécessaire pour lancer le diagnostic.')).toBeVisible();

  await page.getByLabel(/Titre/).fill('Permettre aux clients d’archiver leurs commandes terminées');
  await expect(launch).toBeEnabled();
  await launch.click();

  // L'analyse diffuse sa progression, puis propose le diagnostic.
  await expect(page).toHaveURL(/\/analyse$/);
  await expect(page.getByText('Analyse terminée')).toBeVisible();
  await page.getByRole('link', { name: 'Voir le diagnostic' }).click();

  // Diagnostic : les bloquants du cache sont affichés.
  await expect(page).toHaveURL(/\/diagnostic$/);
  await expect(page.getByRole('list', { name: 'Niveaux de préparation' })).toContainText(
    'Presque prêt',
  );

  await page.getByRole('link', { name: 'Continuer dans l’atelier' }).click();
  await expect(page).toHaveURL(/\/atelier/);

  // Suggestions : répondre retire la suggestion du compte restant.
  await page.getByRole('link', { name: /^Suggestions/ }).click();
  await expect(page).toHaveURL(/vue=suggestions/);
  await page.getByRole('button', { name: 'Livrées et annulées' }).click();
  await expect(page.getByText('Livrées et annulées').first()).toBeVisible();

  // Conversation : une réponse de l'agent propose une modification à appliquer.
  await page.getByRole('link', { name: /^Conversation/ }).click();
  await page
    .getByLabel('Message à l’agent')
    .fill('Les commandes archivées restent-elles visibles ?');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Repéré dans')).toBeVisible();
  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page.getByText('Question ouverte').first()).toBeVisible();

  // Copie du ticket en Markdown, avec confirmation.
  await page.getByRole('button', { name: 'Copier en Markdown' }).click();
  await expect(page.getByText('Ticket copié en Markdown')).toBeVisible();
});

test('garde de navigation : sans titre, l’atelier renvoie vers la saisie', async ({ page }) => {
  await mockApi(page);
  await page.goto('/atelier');
  await expect(page).toHaveURL(/\/saisie$/);
});

test('page introuvable : message et retour vers la saisie', async ({ page }) => {
  await mockApi(page);
  await page.goto('/cette-page-nexiste-pas');
  await expect(page.getByText('Page introuvable')).toBeVisible();
});
