#!/usr/bin/env node
/**
 * Capture the screenshots used on the /features landing pages.
 *
 * Signs in once, visits each feature in the running app, and writes a WebP per
 * shot to static/images/feature-pages/. Re-run it whenever the UI changes.
 *
 * Needs the dev server running (npm run dev) and an account to sign in with:
 *
 *   SCREENSHOT_EMAIL=you@example.com SCREENSHOT_PASSWORD=... npm run screenshots:features
 *   npm run screenshots:features -- --only tutor,review    # just these shots
 *   npm run screenshots:features -- --survey               # full-page PNGs to the temp dir, for picking crops
 *
 * The signed-in session is cached in .auth/ (gitignored) so later runs skip login.
 */

import { chromium, type Page } from 'playwright';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'static/images/feature-pages');
const AUTH_FILE = join(root, '.auth/screenshots.json');
const SURVEY_DIR = join(tmpdir(), 'feature-screenshot-survey');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';

interface Shot {
	/** Output file name, without extension. */
	name: string;
	path: string;
	/** Crop to this element, plus PAD of the page around it. Omit for the viewport. */
	selector?: string;
	/** Anything to do before the capture: open a modal, answer a question. */
	prepare?: (page: Page) => Promise<void>;
	viewport?: { width: number; height: number };
}

const DESKTOP = { width: 1280, height: 860 };

const GAME = { width: 1024, height: 900 };
/** Breathing room around an element crop, in CSS pixels. */
const PAD = 28;

/** The generated games open on a Start button, then write the round. */
async function startRound(page: Page) {
	await page.getByRole('button', { name: /^Start/ }).click();
	await page.locator('.waiting').waitFor({ state: 'detached', timeout: 60_000 });
}

// Collapsed sidebar, no chat bubble, no footer: just the feature.
const HIDE_CHROME = `
	button[aria-label="Expand sidebar"],
	.fixed.bottom-4.right-4.z-50,
	footer { display: none !important; }
`;

const SHOTS: Shot[] = [
	{ name: 'tutor', path: '/tutor', viewport: { width: 1100, height: 760 } },
	{ name: 'stories', path: '/stories/at-the-restaurant', viewport: { width: 1100, height: 820 } },
	{
		name: 'define',
		path: '/stories/at-the-restaurant',
		viewport: { width: 1100, height: 820 },
		prepare: async (page) => {
			await page.getByText('ترابيزة', { exact: true }).first().click();
			await page.getByRole('button', { name: /^Define/ }).click();
			// The definition is looked up on demand.
			await page.waitForTimeout(8000);
		}
	},
	{
		name: 'compare-modal',
		path: '/stories/at-the-restaurant',
		viewport: { width: 1100, height: 900 },
		prepare: async (page) => {
			await page.getByText('ترابيزة', { exact: true }).first().click();
			await page.getByRole('button', { name: /^Define/ }).click();
			await page.getByRole('button', { name: 'Compare Dialects' }).click({ timeout: 15_000 });
			await page.waitForTimeout(10_000);
		}
	},
	{ name: 'stories-library', path: '/stories', viewport: { width: 1280, height: 900 } },
	{ name: 'games', path: '/learn/game', viewport: { width: 1100, height: 760 } },
	{ name: 'lessons', path: '/lessons/structured/egyptian-arabic', viewport: { width: 1024, height: 900 } },
	{
		name: 'review',
		path: '/review',
		viewport: { width: 1024, height: 720 },
		prepare: async (page) => {
			await page.getByRole('button', { name: 'Reveal Translation' }).click();
		}
	},
	{ name: 'speak', path: '/speak', viewport: { width: 1024, height: 900 } },
	{ name: 'alphabet', path: '/alphabet/learn', viewport: { width: 1200, height: 720 } },
	{ name: 'sentences', path: '/sentences', viewport: { width: 1024, height: 900 } },
	{ name: 'conjugations', path: '/egyptian-arabic/conjugations/rah-ma3a', viewport: { width: 1024, height: 1000 } },
	{ name: 'dialect-compare', path: '/egyptian-arabic-vs-levantine', viewport: { width: 1100, height: 900 } },
	{ name: 'import', path: '/review/import', viewport: { width: 1024, height: 860 } },
	{ name: 'all-words', path: '/review/all-words', viewport: { width: 1280, height: 860 } },
	{
		name: 'game-word-scramble',
		path: '/learn/game/word-scramble',
		selector: '.play-area',
		viewport: GAME,
		prepare: async (page) => {
			await page.getByRole('button', { name: 'Hint' }).click();
		}
	},
	{
		name: 'game-odd-one-out',
		path: '/learn/game/odd-one-out',
		selector: '.play-area',
		viewport: GAME,
		prepare: startRound
	},
	{
		name: 'game-spot-the-mistake',
		path: '/learn/game/spot-the-mistake',
		selector: '.play-area',
		viewport: GAME,
		prepare: startRound
	},
	{
		name: 'game-sentence-scramble',
		path: '/learn/game/sentence-scramble',
		selector: '.play-area',
		viewport: GAME,
		prepare: startRound
	},
	{
		name: 'game-room-hunt',
		path: '/learn/game/room-hunt?room=kitchen&dialect=egyptian-arabic',
		// The lesson runs fullscreen, so the viewport is the shot.
		viewport: { width: 1280, height: 730 },
		prepare: async (page) => {
			await page.getByText(/Setting up the/).waitFor({ state: 'detached', timeout: 60_000 });
			await page.getByRole('button', { name: /^(Start|Practice)/ }).click();
			// Let the view turn to the first glowing object and its name play.
			await page.waitForTimeout(2500);
		}
	},
	{
		name: 'game-quiz',
		path: '/learn/game/quiz',
		// The quiz starts on its own page, /learn/game/play.
		selector: 'section.max-w-2xl',
		viewport: GAME,
		prepare: async (page) => {
			await page.getByRole('button', { name: /Start Game/ }).click();
			await page.waitForURL(/\/learn\/game\/play/, { timeout: 60_000 });
			await page.getByText(/^Score:/).first().waitFor({ timeout: 60_000 });
		}
	}
];

function parseArgs() {
	const args = process.argv.slice(2);
	const onlyIdx = args.indexOf('--only');
	return {
		survey: args.includes('--survey'),
		only: onlyIdx >= 0 ? new Set(args[onlyIdx + 1]?.split(',')) : null
	};
}

async function signIn(page: Page) {
	const email = process.env.SCREENSHOT_EMAIL;
	const password = process.env.SCREENSHOT_PASSWORD;
	if (!email || !password) {
		throw new Error('Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD to sign in.');
	}
	await page.goto(`${BASE_URL}/login`);
	// The login page renders one form per layout; only one is visible.
	await page.locator('input[name="email"]:visible').fill(email);
	await page.locator('input[name="password"]:visible').fill(password);
	await page.locator('button[type="submit"]:visible').first().click();
	await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function cropTo(page: Page, selector: string) {
	const box = await page.locator(selector).first().boundingBox();
	if (!box) throw new Error(`Nothing visible matches ${selector}`);
	const scrollY = await page.evaluate(() => window.scrollY);
	const x = Math.max(0, box.x - PAD);
	const y = Math.max(0, box.y + scrollY - PAD);
	return page.screenshot({
		fullPage: true,
		clip: { x, y, width: box.width + PAD * 2, height: box.height + PAD * 2 }
	});
}

async function main() {
	const { survey, only } = parseArgs();
	const shots = only ? SHOTS.filter((s) => only.has(s.name)) : SHOTS;
	mkdirSync(survey ? SURVEY_DIR : OUT_DIR, { recursive: true });
	mkdirSync(dirname(AUTH_FILE), { recursive: true });

	// The installed Chrome: Playwright's bundled Chromium here is too old for current macOS.
	// Headless Chrome has WebGL off; software rendering is enough for Room Hunt's 3D rooms.
	const browser = await chromium.launch({
		channel: 'chrome',
		args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
	});
	const context = await browser.newContext({
		viewport: DESKTOP,
		deviceScaleFactor: 2,
		colorScheme: 'light',
		storageState: existsSync(AUTH_FILE) ? AUTH_FILE : undefined
	});
	await context.addInitScript(() => localStorage.setItem('sidebar-collapsed', 'true'));
	const page = await context.newPage();

	// A cached session can expire; sign in again if /review bounces us.
	await page.goto(`${BASE_URL}/review`);
	if (page.url().includes('/login')) {
		await signIn(page);
		await context.storageState({ path: AUTH_FILE });
	}

	for (const shot of shots) {
		await page.setViewportSize(shot.viewport ?? DESKTOP);
		await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle' });
		await page.addStyleTag({ content: HIDE_CHROME });
		await shot.prepare?.(page);
		// A compile error mid-edit would otherwise be saved as the screenshot.
		if (await page.locator('vite-error-overlay').count()) {
			throw new Error(`${shot.name}: the page is showing a Vite error overlay`);
		}
		// Let entrance animations settle.
		await page.waitForTimeout(800);

		if (survey) {
			const file = join(SURVEY_DIR, `${shot.name}.png`);
			await page.screenshot({ path: file, fullPage: true });
			console.log(`survey  ${shot.name}  ${file}`);
			continue;
		}

		const png = shot.selector ? await cropTo(page, shot.selector) : await page.screenshot();
		const file = join(OUT_DIR, `${shot.name}.webp`);
		const { width, height } = await sharp(png).webp({ quality: 82 }).toFile(file);
		console.log(`saved   ${shot.name}  ${width}x${height}`);
	}

	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
