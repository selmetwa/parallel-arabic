import { getStroke } from 'perfect-freehand';

/** One stroke as drawn: [x, y, pressure] per pointer event. */
export type StrokePoints = number[][];

/** An SVG path for one freehand stroke, `size` pixels wide. */
export function strokePath(points: StrokePoints, size: number): string {
	const stroke = getStroke(points, {
		size,
		thinning: 0.5,
		smoothing: 0.2,
		streamline: 0.2,
		simulatePressure: true,
		start: {
			taper: 0,
			easing: (t) => 1 - Math.cos((t * Math.PI) / 2)
		},
		end: {
			taper: 0,
			easing: (t) => 1 - Math.cos((t * Math.PI) / 2)
		}
	});
	if (!stroke.length) return '';

	const d = stroke.reduce(
		(acc: (string | number)[], [x0, y0], i, arr) => {
			const [x1, y1] = arr[(i + 1) % arr.length];
			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
			return acc;
		},
		['M', ...stroke[0], 'Q']
	);

	d.push('Z');
	return d.join(' ');
}
