// Drag-to-select across words, for mouse and touch.
// Words inside `node` must carry a `data-word-index` attribute.
// On touch, a long-press starts the drag so quick swipes still scroll.

type WordDragSelectOptions = {
	onStart: (index: number) => void;
	onExtend: (index: number) => void;
	onEnd: () => void;
};

const LONG_PRESS_MS = 250;
const MOVE_TOLERANCE_PX = 10;

export function wordDragSelect(node: HTMLElement, options: WordDragSelectOptions) {
	let opts = options;
	let selecting = false;
	let lastIndex = -1;
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let touchStartX = 0;
	let touchStartY = 0;

	node.style.setProperty('-webkit-touch-callout', 'none');

	function indexOf(target: EventTarget | Element | null): number {
		const el = (target as Element | null)?.closest?.('[data-word-index]');
		if (!el || !node.contains(el)) return -1;
		return Number(el.getAttribute('data-word-index'));
	}

	function indexAt(x: number, y: number): number {
		return indexOf(document.elementFromPoint(x, y));
	}

	function start(index: number) {
		selecting = true;
		lastIndex = index;
		opts.onStart(index);
	}

	function extend(index: number) {
		if (index === -1 || index === lastIndex) return;
		lastIndex = index;
		opts.onExtend(index);
	}

	function end() {
		if (!selecting) return;
		selecting = false;
		lastIndex = -1;
		opts.onEnd();
	}

	function clearTimer() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	// ── Mouse ──
	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		const index = indexOf(e.target);
		if (index === -1) return;
		e.preventDefault();
		start(index);
	}

	function onMouseMove(e: MouseEvent) {
		if (selecting) extend(indexAt(e.clientX, e.clientY));
	}

	// ── Touch ──
	function onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		const index = indexOf(e.target);
		if (index === -1) return;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		clearTimer();
		pressTimer = setTimeout(() => {
			pressTimer = null;
			start(index);
			navigator.vibrate?.(10);
		}, LONG_PRESS_MS);
	}

	function onTouchMove(e: TouchEvent) {
		const touch = e.touches[0];
		if (pressTimer) {
			const dx = touch.clientX - touchStartX;
			const dy = touch.clientY - touchStartY;
			if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clearTimer();
			return;
		}
		if (!selecting) return;
		e.preventDefault();
		extend(indexAt(touch.clientX, touch.clientY));
	}

	function onTouchEnd(e: TouchEvent) {
		clearTimer();
		if (!selecting) return;
		// Suppress the emulated mouse events + click that would define the single word under the finger
		e.preventDefault();
		end();
	}

	function onContextMenu(e: Event) {
		if (pressTimer || selecting) e.preventDefault();
	}

	node.addEventListener('mousedown', onMouseDown);
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', end);
	node.addEventListener('touchstart', onTouchStart, { passive: true });
	node.addEventListener('touchmove', onTouchMove, { passive: false });
	node.addEventListener('touchend', onTouchEnd);
	node.addEventListener('touchcancel', onTouchEnd);
	node.addEventListener('contextmenu', onContextMenu);

	return {
		update(newOptions: WordDragSelectOptions) {
			opts = newOptions;
		},
		destroy() {
			clearTimer();
			node.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', end);
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchEnd);
			node.removeEventListener('contextmenu', onContextMenu);
		}
	};
}
