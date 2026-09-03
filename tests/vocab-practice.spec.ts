import { expect, test } from '@playwright/test';

/**
 * The practice round is the conversion path on ~250 prerendered word pages that
 * arrive from search, so the thing worth protecting is that a signed-out
 * visitor with no microphone can still finish it and reach the CTA.
 *
 * Playwright grants no microphone by default, which is exactly the case we care
 * about: every speaking slot should fall back to multiple choice rather than
 * dead-ending the round.
 */
const WORD_PAGE = '/egyptian-arabic/word/akl';

test('a signed-out visitor can finish a round and reach the paywall CTA', async ({ page }) => {
	await page.goto(WORD_PAGE);
	await page.getByRole('button', { name: 'Start practicing' }).click();

	// Eight questions, none of which may gate a signed-out visitor.
	for (let i = 1; i <= 8; i++) {
		await expect(page.getByText(`Question ${i} of 8`)).toBeVisible();

		await page.getByTestId('quiz-option').first().click();
		await page.getByRole('button', { name: 'Continue' }).click();
	}

	await expect(page.getByText(/^\d+ out of 8$/)).toBeVisible();

	await page.getByRole('button', { name: /^Practice all \d+ words$/ }).click();
	await expect(page.locator('dialog[open]')).toBeVisible();
});

test('the word page renders its full content to a signed-out visitor', async ({ page }) => {
	await page.goto(WORD_PAGE);

	// Same content for a crawler and a logged-out human — no paywall on the
	// word itself, which is what the page ranks for.
	await expect(page.getByRole('heading', { level: 1 })).toContainText('food');
	await expect(page.getByRole('heading', { name: /in a sentence/ })).toBeVisible();
});

test('a vocabulary topic page lists its whole word set to a signed-out visitor', async ({
	page
}) => {
	await page.goto('/egyptian-arabic/vocabulary/numbers');

	// The table is what the page ranks for, so all of it has to be in the HTML
	// with no account and no paywall in front of it.
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Numbers');
	await expect(page.getByRole('row')).toHaveCount(51); // 50 numbers + header
	await expect(page.getByText('واحِد')).toBeVisible();

	// And the practice round is reachable from it.
	await expect(page.getByRole('button', { name: 'Start practicing' })).toBeVisible();
});

test('the vocabulary hub links every topic', async ({ page }) => {
	await page.goto('/egyptian-arabic/vocabulary');

	await expect(page.getByRole('heading', { level: 1 })).toContainText('Egyptian Arabic Vocabulary');
	await expect(page.getByRole('link', { name: /Numbers/ })).toBeVisible();
});
