<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { geoMercator, geoPath } from 'd3';

	type DialectOption = {
		id: string;
		label: string;
		emoji: string;
		description: string;
		accent: string;
		deep: string;
	};

	type Props = {
		dialects: DialectOption[];
		value: string;
		onSelect: (id: string) => void;
	};

	let { dialects, value, onSelect }: Props = $props();

	const WIDTH = 800;
	const HEIGHT = 380;
	/** How far the map pushes in on a chosen region. */
	const ZOOM = 1.6;

	// ISO_A3 → dialect. Every other Arab country on the map belongs to Fusha,
	// which has no home region: choosing it lights the whole Arab world.
	const COUNTRY_DIALECT: Record<string, string> = {
		EGY: 'egyptian-arabic',
		MAR: 'darija',
		SYR: 'levantine',
		LBN: 'levantine',
		JOR: 'levantine',
		ISR: 'levantine',
		PSE: 'levantine',
		IRQ: 'iraqi',
		ARE: 'khaleeji',
		KWT: 'khaleeji',
		QAT: 'khaleeji',
		BHR: 'khaleeji',
		OMN: 'khaleeji',
		SAU: 'saudi'
	};

	// Pin positions [lng, lat]
	const REGION_PINS: Record<string, [number, number]> = {
		'egyptian-arabic': [30.5, 26.8],
		levantine: [36.8, 33.6],
		darija: [-6.8, 31.6],
		iraqi: [44.4, 33.3],
		khaleeji: [54.4, 24.4],
		saudi: [39.2, 21.5]
	};

	const projection = geoMercator()
		.fitSize([WIDTH, HEIGHT], {
			type: 'MultiPoint',
			coordinates: [
				[-18, 10],
				[61, 41]
			]
		})
		.clipExtent([
			[0, 0],
			[WIDTH, HEIGHT]
		]);
	const path = geoPath(projection).digits(1);

	let geo = $state.raw<any>(null);
	let hovered = $state('');

	onMount(() => {
		// The buttons below still work if the map never arrives.
		fetch('/data/arab-world.geojson')
			.then((res) => res.json())
			.then((data) => (geo = data))
			.catch(() => {});
	});

	let active = $derived(hovered || value);
	let activeDialect = $derived(dialects.find((d) => d.id === active));
	let accents = $derived(Object.fromEntries(dialects.map((d) => [d.id, d.accent])));

	let countries = $derived(
		(geo?.features ?? []).map((feature: any) => {
			const iso: string | null = feature.properties.ISO_A3;
			return {
				d: path(feature) ?? '',
				// null for the surrounding, non-Arab land
				// A country whose dialect isn't offered falls back to Fusha.
				dialect: iso ? (COUNTRY_DIALECT[iso] in accents ? COUNTRY_DIALECT[iso] : 'fusha') : null
			};
		})
	);

	let pins = $derived(
		dialects
			.filter((d) => d.id in REGION_PINS)
			.map((d) => {
				const [x, y] = projection(REGION_PINS[d.id]) ?? [0, 0];
				return { id: d.id, label: d.label, accent: d.accent, x, y };
			})
	);

	// Push in on the chosen region, without sliding the map's edge into view.
	let zoomTransform = $derived.by(() => {
		const pin = pins.find((p) => p.id === value);
		if (!pin) return 'translate(0px, 0px) scale(1)';
		const tx = Math.min(0, Math.max(WIDTH - ZOOM * WIDTH, WIDTH / 2 - ZOOM * pin.x));
		const ty = Math.min(0, Math.max(HEIGHT - ZOOM * HEIGHT, HEIGHT / 2 - ZOOM * pin.y));
		return `translate(${tx}px, ${ty}px) scale(${ZOOM})`;
	});

	function hover(event: PointerEvent, id: string) {
		// Touch has no hover; a tap would leave the highlight stuck.
		if (event.pointerType === 'mouse') hovered = id;
	}
</script>

<div class="mx-auto max-w-2xl">
	<!-- The map is a pointer shortcut; the buttons below are the accessible control. -->
	<svg class="map" viewBox="0 0 {WIDTH} {HEIGHT}" aria-hidden="true">
		<g class="zoom" style="transform: {zoomTransform};">
			{#each countries as country, i (i)}
				{#if country.dialect}
					{@const lit = active === country.dialect || active === 'fusha'}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<path
						class="country {lit ? 'is-lit' : ''} {country.dialect !== 'fusha' ? 'is-region' : ''}"
						style="--c:{accents[active === 'fusha' ? 'fusha' : country.dialect]};"
						d={country.d}
						onclick={() => onSelect(country.dialect)}
						onpointerenter={(e) => hover(e, country.dialect)}
						onpointerleave={() => (hovered = '')}
					/>
				{:else}
					<path class="land" d={country.d} />
				{/if}
			{/each}

			{#if geo}
				{#each pins as pin (pin.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<g
						class="pin {value === pin.id ? 'is-on' : ''}"
						style="--c:{pin.accent};"
						transform="translate({pin.x}, {pin.y})"
						onclick={() => onSelect(pin.id)}
						onpointerenter={(e) => hover(e, pin.id)}
						onpointerleave={() => (hovered = '')}
					>
						<circle class="pin-ripple" r="9" />
						<circle class="pin-dot" r="9" />
						<!-- Generous tap target: Lebanon is a few pixels wide on a phone -->
						<circle class="pin-hit" r="44" />
					</g>
				{/each}
			{/if}
		</g>
	</svg>

	<p class="caption" aria-live="polite">
		{#if activeDialect}
			<strong>{activeDialect.label}</strong> · {activeDialect.description}
		{:else}
			Tap a region on the map, or pick below
		{/if}
	</p>

	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
		{#each dialects as dialect (dialect.id)}
			<button
				class="pick {value === dialect.id ? 'is-on' : ''}"
				style="--accent:{dialect.accent}; --deep:{dialect.deep};"
				aria-pressed={value === dialect.id}
				onclick={() => onSelect(dialect.id)}
				onpointerenter={(e) => hover(e, dialect.id)}
				onpointerleave={() => (hovered = '')}
				onfocus={() => (hovered = dialect.id)}
				onblur={() => (hovered = '')}
			>
				<span class="pick-emoji" aria-hidden="true">{dialect.emoji}</span>
				<span class="pick-name">{dialect.label}</span>
				{#if value === dialect.id}
					<span class="pick-check" in:scale={{ duration: 250, easing: backOut }} aria-hidden="true">
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.map {
		--sea: color-mix(in srgb, var(--brand) 14%, var(--tile2));
		display: block;
		width: 100%;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--sea);
		box-shadow: 0 5px 0 var(--tile5);
	}

	.zoom {
		transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.land,
	.country {
		stroke: var(--sea);
		stroke-width: 1px;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	.land {
		fill: var(--tile4);
	}

	.country {
		fill: var(--tile6);
		cursor: pointer;
		transition: fill 0.25s ease;
	}

	/* The three home regions keep a tint of their colour, so they read as tappable */
	.country.is-region {
		fill: color-mix(in srgb, var(--c) 45%, var(--tile6));
	}

	.country.is-lit {
		fill: var(--c);
	}

	.pin {
		cursor: pointer;
	}

	.pin-dot {
		fill: #fff;
		stroke: var(--c);
		stroke-width: 5px;
	}

	.pin-ripple {
		fill: var(--c);
		transform-box: fill-box;
		transform-origin: center;
		animation: ripple 2s ease-out infinite;
	}

	.pin.is-on .pin-ripple {
		animation: none;
		opacity: 0;
	}

	.pin-hit {
		fill: transparent;
	}

	@keyframes ripple {
		from {
			transform: scale(1);
			opacity: 0.6;
		}
		to {
			transform: scale(3);
			opacity: 0;
		}
	}

	.caption {
		min-height: 2.6em;
		margin: 0.9rem 0 0.6rem;
		text-align: center;
		font-size: 0.85rem;
		line-height: 1.3;
		color: var(--text2);
		text-wrap: balance;
	}

	.caption strong {
		font-weight: 600;
		color: var(--text1);
	}

	.pick {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.7rem 0.8rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 5px 0 var(--tile5);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease,
			background 0.18s ease;
	}

	.pick:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 9px 0 var(--deep);
	}

	.pick:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.pick.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 13%, var(--tile3));
		box-shadow: 0 5px 0 var(--deep);
	}

	.pick-emoji {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.pick-name {
		min-width: 0;
		flex: 1;
		text-align: left;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text1);
	}

	.pick-check {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
	}

	.pick-check svg {
		width: 0.7rem;
		height: 0.7rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.zoom,
		.country,
		.pick {
			transition: none;
		}
		.pin-ripple {
			animation: none;
			opacity: 0;
		}
		.pick:hover {
			transform: none;
		}
	}
</style>
