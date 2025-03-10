<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	interface MasonryProps {
		stretchFirst?: boolean;
		gridGap?: string;
		colWidth?: string;
		items?: any[];
		reset?: boolean;
		children: Snippet;
	}

	interface GridItem {
		_el: HTMLElement;
		gap: number;
		items: HTMLElement[];
		ncol: number;
		mod: number;
	}

	let {
		stretchFirst = false,
		gridGap = '0.5em',
		colWidth = 'minmax(Min(20em, 100%), 1fr)',
		items = [],
		reset = false,
		children
	}: MasonryProps = $props();

	let grids: GridItem[] = [];
	let masonryElement: HTMLElement | null = null;

	const refreshLayout = async (): Promise<void> => {
		grids.forEach(async (grid) => {
			const ncol = getComputedStyle(grid._el).gridTemplateColumns.split(' ').length;

			grid.items.forEach((c) => {
				const newHeight = c.getBoundingClientRect().height;
				const currentHeight = parseFloat(c.dataset.h || '0');

				if (newHeight !== currentHeight) {
					c.dataset.h = newHeight.toString();
					grid.mod++;
				}
			});

			if (grid.ncol !== ncol || grid.mod) {
				grid.ncol = ncol;
				grid.items.forEach((c) => c.style.removeProperty('margin-top'));

				if (grid.ncol > 1) {
					grid.items.slice(ncol).forEach((c, i) => {
						const prevBottom = grid.items[i].getBoundingClientRect().bottom;
						const currTop = c.getBoundingClientRect().top;
						c.style.marginTop = `${prevBottom + grid.gap - currTop}px`;
					});
				}

				grid.mod = 0;
			}
		});
	};

	const calcGrid = async (masonryArr: HTMLElement[]): Promise<void> => {
		await tick();

		if (masonryArr.length && getComputedStyle(masonryArr[0]).gridTemplateRows !== 'masonry') {
			grids = masonryArr.map((grid) => ({
				_el: grid,
				gap: parseFloat(getComputedStyle(grid).gridRowGap),
				items: Array.from(grid.childNodes).filter(
					(c): c is HTMLElement =>
						c instanceof HTMLElement && +getComputedStyle(c).gridColumnEnd !== -1
				),
				ncol: 0,
				mod: 0
			}));

			refreshLayout();
		}
	};

	let _window: Window | undefined;

	$effect(() => {
		// on mount
		_window = window;
		_window.addEventListener('resize', refreshLayout, false);

		// cleanup, on destroy
		return () => {
			if (_window) {
				_window.removeEventListener('resize', refreshLayout, false);
			}
		};
	});

	$effect(() => {
		if (masonryElement) {
			calcGrid([masonryElement]);
		}

		if (items.length || reset) {
			masonryElement = masonryElement;
		}
	});
</script>

<div
	bind:this={masonryElement}
	class={`__grid--masonry ${stretchFirst ? '__stretch-first' : ''}`}
	style={`--grid-gap: ${gridGap}; --col-width: ${colWidth};`}
>
	{@render children()}
</div>

<style>
	:global(.__grid--masonry) {
		display: grid;
		grid-template-columns: repeat(auto-fit, var(--col-width));
		grid-template-rows: masonry;
		justify-content: center;
		grid-gap: var(--grid-gap);
		padding: var(--grid-gap);
	}
	:global(.__grid--masonry > *) {
		align-self: start;
	}
	:global(.__grid--masonry.__stretch-first > *:first-child) {
		grid-column: 1/ -1;
	}
</style>