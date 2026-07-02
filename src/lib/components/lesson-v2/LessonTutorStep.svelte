<script lang="ts">
	import { type Dialect, type ConversationMessage } from '$lib/types/index';
	import type { VocabItem } from '$lib/schemas/lesson-v2-schema';
	import ConversationMessageView from '$lib/components/tutor/ConversationMessage.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import { speakArabic } from '$lib/helpers/speak-arabic';

	interface Props {
		dialect: Dialect;
		level: string;
		situation: string;
		studentRole: string;
		otherRole: string;
		goalEnglish: string;
		targetWords: string[];
		vocab: VocabItem[];
		onDone: () => void;
	}

	let {
		dialect,
		level,
		situation,
		studentRole,
		otherRole,
		goalEnglish,
		targetWords,
		vocab,
		onDone
	}: Props = $props();

	type Turn = { role: 'user' | 'assistant'; content: string };

	let messages = $state<ConversationMessage[]>([]);
	let history = $state<Turn[]>([]);
	let input = $state('');
	let loading = $state(false);
	let started = $state(false);
	let showEnglish = $state(false);
	let showTransliteration = $state(true);
	let error = $state<string | null>(null);

	// Speech recording state
	let recording = $state(false);
	let transcribing = $state(false);
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];

	let counter = 0;
	const nextId = () => `msg-${Date.now()}-${counter++}`;

	// Keep the conversation pinned to the latest message so the user never scrolls.
	let messagesEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		// Re-run on each new message / typing indicator.
		void messages.length;
		void loading;
		const el = messagesEl;
		if (el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
	});

	const dialectNameMap: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic (Masri)',
		fusha: 'Modern Standard Arabic',
		levantine: 'Levantine Arabic',
		darija: 'Moroccan Darija',
		iraqi: 'Iraqi Arabic',
		khaleeji: 'Khaleeji Arabic'
	};
	const dialectLabel = $derived(dialectNameMap[dialect] ?? dialect);

	// Words to surface in the panel — the scenario focus first, then the rest of
	// the lesson vocab. The tutor is also told to use these (see opener).
	let focusSet = $derived(new Set(targetWords.map((w) => w.trim().toLowerCase())));
	let panelWords = $derived(
		[...vocab].sort((a, b) => {
			const af = focusSet.has(a.english.trim().toLowerCase()) ? 0 : 1;
			const bf = focusSet.has(b.english.trim().toLowerCase()) ? 0 : 1;
			return af - bf;
		})
	);

	async function callTutor(message: string) {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/tutor-chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message,
					dialect,
					conversation: history,
					proficiencyLevel: level
				})
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'The tutor is unavailable right now.');
			}
			const data = await res.json();
			history.push({ role: 'assistant', content: data.arabic ?? '' });
			messages.push({
				id: nextId(),
				type: 'tutor',
				timestamp: new Date(),
				arabic: data.arabic,
				english: data.english,
				transliteration: data.transliteration,
				wordAlignments: data.wordAlignments
			});
			// Autoplay the tutor's spoken reply (fire-and-forget).
			if (data.arabic) speakArabic(data.arabic, dialect).catch(() => {});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong.';
		} finally {
			loading = false;
		}
	}

	async function start() {
		started = true;
		const focusList = vocab
			.filter((v) => focusSet.has(v.english.trim().toLowerCase()))
			.map((v) => `${v.arabic} (${v.english})`)
			.join(', ');
		const opener =
			`Let's do a short roleplay for practice. Situation: ${situation}. ` +
			`You play ${otherRole}; I play ${studentRole}. My goal: ${goalEnglish}. ` +
			`IMPORTANT: respond ONLY in ${dialectLabel} — natural spoken dialect, NOT Modern Standard Arabic. ` +
			`Naturally use these lesson words and gently encourage me to use them too: ${focusList}. ` +
			`Begin now with one short, natural opening line in ${dialectLabel}.`;
		history.push({ role: 'user', content: opener });
		await callTutor(opener);
	}

	async function send() {
		const text = input.trim();
		if (!text || loading) return;
		input = '';
		history.push({ role: 'user', content: text });
		messages.push({ id: nextId(), type: 'user', timestamp: new Date(), arabic: text });
		await callTutor(text);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	async function toggleRecord() {
		if (recording) {
			mediaRecorder?.stop();
			recording = false;
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];
			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks.push(e.data);
			};
			mediaRecorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				const blob = new Blob(audioChunks, { type: 'audio/webm' });
				if (blob.size < 1000) return;
				transcribing = true;
				try {
					const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
					const fd = new FormData();
					fd.append('audio', file);
					fd.append('dialect', dialect);
					fd.append('language', 'ar');
					const r = await fetch('/api/speech-to-text', { method: 'POST', body: fd });
					const data = await r.json();
					const txt = (data.text || '').trim();
					if (txt) {
						input = input ? `${input} ${txt}` : txt;
						// Auto-send once speaking finishes — no manual Send needed.
						transcribing = false;
						await send();
					}
				} catch {
					error = 'Could not transcribe audio. Please try again or type.';
				} finally {
					transcribing = false;
				}
			};
			mediaRecorder.start();
			recording = true;
		} catch {
			error = 'Microphone access is needed to speak. You can type instead.';
		}
	}

	function insertWord(w: VocabItem) {
		input = input ? `${input}${input.endsWith(' ') ? '' : ' '}${w.arabic}` : w.arabic;
	}

	// onWordClick is required by ConversationMessage; word-define is out of scope
	// for the in-lesson mini-chat, so this is intentionally a no-op.
	function onWordClick() {}
</script>

<div class="tutor-step">
	<div class="scenario">
		<div class="scenario-label">Live conversation · {dialectLabel}</div>
		<p class="situation">{situation}</p>
		<p class="roles">
			You are <strong>{studentRole}</strong>. The tutor is <strong>{otherRole}</strong>.
		</p>
		<p class="goal">🎯 {goalEnglish}</p>
	</div>

	{#if !started}
		<button class="primary" onclick={start}>Start the conversation</button>
	{:else}
		<div class="layout">
			<div class="chat-col">
				<div class="toggles">
					<button class:active={showEnglish} onclick={() => (showEnglish = !showEnglish)}>EN</button>
					<button
						class:active={showTransliteration}
						onclick={() => (showTransliteration = !showTransliteration)}
					>
						Transliteration
					</button>
				</div>

				<div class="messages" bind:this={messagesEl}>
					{#each messages as m (m.id)}
						<div class="msg {m.type}">
							<ConversationMessageView
								message={m}
								{showEnglish}
								{showTransliteration}
								{onWordClick}
							/>
						</div>
					{/each}
					{#if loading}
						<p class="loading">…</p>
					{/if}
				</div>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<div class="composer">
					<div class="speak-zone">
						<button
							class="mic-big"
							class:recording
							onclick={toggleRecord}
							disabled={transcribing || loading}
							aria-label={recording ? 'Stop recording' : 'Speak your reply'}
						>
							{#if recording}
								<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<rect x="9" y="2" width="6" height="12" rx="3" />
									<path stroke-linecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
								</svg>
							{/if}
						</button>
						<span class="mic-label">
							{recording ? 'Listening… tap to stop' : transcribing ? 'Transcribing…' : 'Tap to speak your reply'}
						</span>
					</div>

					<div class="type-row">
						<textarea
							class="type-field"
							bind:value={input}
							onkeydown={handleKeydown}
							placeholder="or type instead…"
							rows="1"
							dir="auto"
						></textarea>
						<button class="send" onclick={send} disabled={loading || !input.trim()}>Send</button>
					</div>
				</div>

				<button class="finish" onclick={onDone}>Finish conversation →</button>
			</div>

			<aside class="word-panel">
				<div class="panel-title">Words to use</div>
				<p class="panel-hint">Tap a word to add it to your reply.</p>
				<ul>
					{#each panelWords as w (w.arabic)}
						<li class:focus={focusSet.has(w.english.trim().toLowerCase())}>
							<button class="word" onclick={() => insertWord(w)}>
								<span class="w-ar" dir="rtl">{w.arabicTashkeel || w.arabic}</span>
								<span class="w-tr">{w.transliteration}</span>
								<span class="w-en">{w.english}</span>
							</button>
							<AudioButton text={w.arabic} {dialect} />
						</li>
					{/each}
				</ul>
			</aside>
		</div>
	{/if}
</div>

<style>
	.tutor-step {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.scenario {
		background: var(--tile1);
		border: 1px solid var(--tile3);
		border-left: 3px solid var(--brand);
		border-radius: 1.1rem;
		padding: 1.1rem 1.35rem;
	}
	.scenario-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--brand);
		margin-bottom: 0.5rem;
	}
	.situation {
		color: var(--text1);
		font-weight: 600;
		margin-bottom: 0.4rem;
	}
	.roles,
	.goal {
		color: var(--text2);
		font-size: 0.9rem;
		margin-bottom: 0.3rem;
	}
	.layout {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
	}
	.chat-col {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.messages {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 30vh;
		max-height: 46vh;
		overflow-y: auto;
		padding: 0.25rem;
	}
	.msg.user {
		align-self: flex-end;
		max-width: 85%;
	}
	.msg.tutor {
		align-self: flex-start;
		max-width: 95%;
	}
	.toggles {
		display: flex;
		gap: 0.4rem;
	}
	.toggles button {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 100px;
		border: 1px solid var(--tile5);
		background: var(--tile2);
		color: var(--text2);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--brand);
		color: white;
		border-color: var(--brand);
	}
	.composer {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 0.85rem 0 0.4rem;
		border-top: 1px solid var(--tile3);
	}
	.speak-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
	}
	.mic-big {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		border: none;
		background: var(--brand);
		color: #fff;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 16px 34px -12px var(--brand);
		transition:
			transform 0.16s ease,
			filter 0.16s ease;
	}
	.mic-big:not(:disabled):hover {
		transform: translateY(-2px) scale(1.03);
		filter: brightness(1.07);
	}
	.mic-big:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.mic-big svg {
		width: 2.1rem;
		height: 2.1rem;
	}
	.mic-big.recording {
		background: #d65745;
		box-shadow: 0 0 0 0 rgba(214, 87, 69, 0.5);
		animation: micRing 1.5s ease-out infinite;
	}
	@keyframes micRing {
		0% {
			box-shadow: 0 0 0 0 rgba(214, 87, 69, 0.55);
		}
		100% {
			box-shadow: 0 0 0 24px rgba(214, 87, 69, 0);
		}
	}
	.mic-label {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text2);
	}
	.type-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.type-field {
		flex: 1;
		resize: none;
		border-radius: 0.75rem;
		border: 1px solid var(--tile4);
		background: var(--tile1);
		color: var(--text2);
		padding: 0.5rem 0.75rem;
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.4;
	}
	.send {
		flex-shrink: 0;
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.5rem 0.95rem;
		border-radius: 0.7rem;
		border: 1px solid var(--tile4);
		background: var(--tile2);
		color: var(--text2);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.send:not(:disabled):hover {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
	.send:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.primary {
		background: var(--brand);
		color: white;
		border: none;
		border-radius: 0.85rem;
		padding: 0.65rem 1.2rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 10px 22px -12px var(--brand);
		transition:
			transform 0.16s ease,
			filter 0.16s ease;
	}
	.primary:not(:disabled):hover {
		transform: translateY(-2px);
		filter: brightness(1.06);
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.finish {
		align-self: flex-end;
		background: none;
		border: none;
		color: var(--text2);
		font-weight: 600;
		cursor: pointer;
		padding: 0.25rem;
	}
	.loading {
		color: var(--text3);
		font-size: 1.5rem;
		letter-spacing: 0.2em;
	}
	.error {
		color: #c0392b;
		font-size: 0.85rem;
	}
	.word-panel {
		width: 240px;
		flex-shrink: 0;
		background: var(--tile2);
		border: 1px solid var(--tile4);
		border-radius: 1rem;
		padding: 0.85rem;
		max-height: 60vh;
		overflow-y: auto;
	}
	.panel-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text3);
	}
	.panel-hint {
		font-size: 0.75rem;
		color: var(--text3);
		margin: 0.3rem 0 0.6rem;
	}
	.word-panel ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.word-panel li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		border-radius: 0.6rem;
		padding: 0.2rem;
	}
	.word-panel li.focus {
		background: color-mix(in srgb, var(--brand) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--brand) 28%, transparent);
	}
	.word {
		flex: 1;
		min-width: 0;
		text-align: right;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.25rem 0.35rem;
		border-radius: 0.5rem;
	}
	.word:hover {
		background: var(--tile3);
	}
	.w-ar {
		font-size: 1.1rem;
		color: var(--text1);
	}
	.w-tr {
		font-size: 0.75rem;
		color: var(--text2);
	}
	.w-en {
		font-size: 0.75rem;
		color: var(--text3);
	}
	@media (max-width: 720px) {
		.layout {
			flex-direction: column;
		}
		.word-panel {
			width: 100%;
			max-height: 30vh;
		}
	}
</style>
