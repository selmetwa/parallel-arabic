#!/usr/bin/env node
/**
 * Capture Room Hunt's screenshots and screen recordings for its feature page
 * and blog post: a lesson, a "Find it" round, "Name it", and the "Order a
 * meal" scene with the waiter.
 *
 * Needs the dev server running and the signed-in session cached by
 * capture-feature-screenshots.ts (.auth/screenshots.json). Recordings come out
 * of Playwright as WebM; with FFMPEG pointing at an ffmpeg binary they are
 * trimmed to the action and converted to MP4 (H.264, plays everywhere).
 *
 *   FFMPEG=/path/to/ffmpeg npm run screenshots:room-hunt
 *   npm run screenshots:room-hunt -- --only order-video
 */

import { chromium, type Browser, type Page } from 'playwright';
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'static/images/feature-pages');
const AUTH_FILE = join(root, '.auth/screenshots.json');
const VIDEO_TMP = join(tmpdir(), 'room-hunt-videos');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const FFMPEG = process.env.FFMPEG;

const VIEWPORT = { width: 1280, height: 720 };
const URL = (room: string) => `${BASE_URL}/learn/game/room-hunt?room=${room}&dialect=egyptian-arabic`;

type Settings = { level: 'easy' | 'normal' | 'hard'; mode: 'find' | 'name' };

async function newPage(browser: Browser, settings: Settings, record = false) {
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: record ? 1 : 2,
		colorScheme: 'light',
		storageState: existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
		recordVideo: record ? { dir: VIDEO_TMP, size: VIEWPORT } : undefined
	});
	await context.addInitScript((s) => {
		localStorage.setItem('sidebar-collapsed', 'true');
		localStorage.setItem('pa-room-hunt-settings', JSON.stringify(s));
		// Muted, the game pauses a fixed time on each line: steady pacing for the camera.
		localStorage.setItem('pa-room-hunt-muted', '1');
		localStorage.removeItem('pa-room-hunt-learned');
	}, settings);
	const page = await context.newPage();
	return { context, page, started: Date.now() };
}

async function openRoom(page: Page, room: string) {
	await page.goto(URL(room), { waitUntil: 'networkidle' });
	await page.getByText(/Setting up the/).waitFor({ state: 'detached', timeout: 60_000 });
	if (await page.locator('vite-error-overlay').count()) throw new Error('Vite error overlay');
}

async function shot(page: Page, name: string) {
	const file = join(OUT_DIR, `${name}.webp`);
	const { width, height } = await sharp(await page.screenshot())
		.webp({ quality: 82 })
		.toFile(file);
	console.log(`saved   ${name}  ${width}x${height}`);
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
const centre = (page: Page) => page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2 - 40);

async function reply(page: Page, english: string) {
	const option = page.locator('.reply .option', { hasText: english });
	await option.waitFor({ timeout: 90_000 });
	// Let the viewer read the waiter's line before answering.
	await pause(page, 1400);
	await option.click();
}

/** The whole meal, from the waiter walking in to the receipt. */
async function playOrder(page: Page, capture: boolean) {
	await page.getByRole('button', { name: 'Order', exact: true }).click();
	await reply(page, 'Thank you!');
	if (capture) await shot(page, 'room-hunt-order-waiter');
	await reply(page, 'Tea, please.');
	await reply(page, 'Fish, please.');
	await page.locator('.caption', { hasText: 'Enjoy your meal' }).waitFor({ timeout: 90_000 });
	await pause(page, 1600);
	if (capture) await shot(page, 'room-hunt-order-served');
	await reply(page, 'Thank you!');
	await reply(page, 'Yes, cake please.');
	await reply(page, 'Delicious! The bill, please.');
	await reply(page, 'Thank you, goodbye!');
	await page.getByText('Dinner ordered in Arabic!').waitFor({ timeout: 30_000 });
	await pause(page, 1500);
	if (capture) await shot(page, 'room-hunt-order-receipt');
}

/** A lesson: tap the four glowing objects (the view turns to each), then a few finds. */
async function playLesson(page: Page, capture: boolean) {
	await page.getByRole('button', { name: /^Start/ }).click();
	for (let i = 0; i < 4; i++) {
		await page.locator('.hud-card', { hasText: 'New word' }).waitFor();
		await pause(page, 1800);
		if (capture && i === 1) await shot(page, 'room-hunt-learn');
		await centre(page);
	}
	// "Find it": a wrong tap names what was tapped; two misses and the answer glows.
	await page.locator('.hud-card .word-ar').waitFor({ timeout: 10_000 });
	await pause(page, 1500);
	if (capture) await shot(page, 'room-hunt-find');
	await page.mouse.click(120, 420);
	await pause(page, 1600);
	await page.mouse.click(1160, 420);
	await pause(page, 1800);
	if (capture) await shot(page, 'room-hunt-hint');
	await centre(page);
	await pause(page, 2000);
}

async function nameIt(page: Page) {
	await page.getByRole('button', { name: /^Start/ }).click();
	for (let i = 0; i < 4; i++) {
		await page.locator('.hud-card', { hasText: 'New word' }).waitFor();
		await pause(page, 600);
		await page.getByRole('button', { name: 'Next', exact: true }).click();
	}
	await page.locator('.choices').waitFor({ timeout: 10_000 });
	await pause(page, 1800);
	await shot(page, 'room-hunt-name');
}

/** Saves a context's recording, trimmed to start at `from` ms, as MP4 (or WebM without ffmpeg). */
async function saveVideo(page: Page, name: string, fromMs: number) {
	const video = page.video();
	await page.context().close();
	if (!video) return;
	const raw = await video.path();
	if (!FFMPEG) {
		renameSync(raw, join(OUT_DIR, `${name}.webm`));
		console.log(`saved   ${name}.webm (set FFMPEG to trim and convert)`);
		return;
	}
	const out = join(OUT_DIR, `${name}.mp4`);
	execFileSync(FFMPEG, [
		'-y',
		'-loglevel',
		'error',
		'-ss',
		(fromMs / 1000).toFixed(2),
		'-i',
		raw,
		'-c:v',
		'libx264',
		'-pix_fmt',
		'yuv420p',
		'-crf',
		'28',
		'-preset',
		'slow',
		'-movflags',
		'+faststart',
		'-an',
		out
	]);
	rmSync(raw);
	console.log(`saved   ${name}.mp4`);
}

async function main() {
	const only = process.argv.includes('--only')
		? new Set(process.argv[process.argv.indexOf('--only') + 1]?.split(','))
		: null;
	const want = (name: string) => !only || only.has(name);
	mkdirSync(OUT_DIR, { recursive: true });
	mkdirSync(VIDEO_TMP, { recursive: true });

	// Headless Chrome has WebGL off; software rendering is enough for these rooms.
	const browser = await chromium.launch({
		channel: 'chrome',
		args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
	});

	if (want('stills')) {
		const easy = await newPage(browser, { level: 'easy', mode: 'find' });
		await openRoom(easy.page, 'kitchen');
		await playLesson(easy.page, true);
		await openRoom(easy.page, 'restaurant');
		await playOrder(easy.page, true);
		await easy.context.close();

		const name = await newPage(browser, { level: 'normal', mode: 'name' });
		await openRoom(name.page, 'bathroom');
		await nameIt(name.page);
		await name.context.close();
	}

	if (want('order-video')) {
		const { page, started } = await newPage(browser, { level: 'easy', mode: 'find' }, true);
		await openRoom(page, 'restaurant');
		const from = Date.now() - started;
		await playOrder(page, false);
		await saveVideo(page, 'room-hunt-order', from);
	}

	if (want('lesson-video')) {
		const { page, started } = await newPage(browser, { level: 'easy', mode: 'find' }, true);
		await openRoom(page, 'kitchen');
		const from = Date.now() - started;
		await playLesson(page, false);
		await saveVideo(page, 'room-hunt-lesson', from);
	}

	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
