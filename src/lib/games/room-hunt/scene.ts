/**
 * The 3D side of Room Hunt: one room, a camera standing in its middle that the
 * player drags to look around, and taps turned into object ids.
 *
 * three.js is only ever loaded through `createRoomScene`, a dynamic import, so
 * it stays out of the server render and the main bundle. The scene renders on
 * demand (after a drag, a resize or while a highlight animates), not every frame.
 *
 * Tapping is tested against an invisible box around each object, a little
 * bigger than the object, so a fork on a table is still easy to hit on a phone.
 */
import type * as Three from 'three';
import type { GLTFLoader as GLTFLoaderType } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { clone as CloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Placement, Room } from './rooms';

type ThreeModule = typeof Three;

export type Flash = 'correct' | 'wrong';

export interface PickEvent {
	id: string;
	placement: number;
}

/** Smallest side of a tap target, in metres. */
const MIN_TARGET = 0.24;
const EYE_HEIGHT = 1.55;
const PITCH_MIN = -1.05;
const PITCH_MAX = 0.55;
/** Pointer travel, in px, under which a press counts as a tap rather than a drag. */
const TAP_SLOP = 8;
/** Radians per pixel dragged: a full swipe across a phone turns about 30°. */
const DRAG_SPEED = 0.0015;
/**
 * Fingers on a phone travel a few hundred pixels at most, so touch turns
 * faster: a swipe across a phone turns about 120°, enough to look behind you
 * in two swipes.
 */
const TOUCH_DRAG_SPEED = 0.0055;

const COLORS = {
	hover: 0x2a2a2a,
	correct: 0x16a34a,
	wrong: 0xdc2626,
	hint: 0xf59e0b,
	focus: 0x0ea5e9
};

export type Spotlight = 'hint' | 'focus';

interface Placed {
	id: string;
	group: Three.Group;
	box: Three.Box3;
	materials: Three.MeshStandardMaterial[];
}

/** Where the camera stands and which way it looks. */
export interface Pose {
	at: [number, number, number];
	yaw: number;
	pitch: number;
}

interface Character {
	group: Three.Group;
	mixer: Three.AnimationMixer;
	actions: Map<string, Three.AnimationAction>;
	current: Three.AnimationAction | null;
	/** Bumped by each walk, so a newer walk cancels an older one. */
	walk: number;
}

const WALK_SPEED = 1.3;

interface Tween {
	start: number;
	duration: number;
	step: (t: number) => void;
	done?: () => void;
}

export async function createRoomScene(
	canvas: HTMLCanvasElement,
	options: { reducedMotion: boolean }
): Promise<RoomScene> {
	const [THREE, { GLTFLoader }, { clone }] = await Promise.all([
		import('three'),
		import('three/examples/jsm/loaders/GLTFLoader.js'),
		import('three/examples/jsm/utils/SkeletonUtils.js')
	]);
	return new RoomScene(THREE, new GLTFLoader(), clone, canvas, options.reducedMotion);
}

export class RoomScene {
	private renderer: Three.WebGLRenderer;
	private scene: Three.Scene;
	private camera: Three.PerspectiveCamera;
	private raycaster: Three.Raycaster;
	private roomGroup: Three.Group | null = null;
	private placed: Placed[] = [];
	private proxies: Three.Mesh[] = [];
	private templates = new Map<string, Promise<Three.Group>>();
	private characterModels = new Map<string, Promise<{ scene: Three.Group; clips: Three.AnimationClip[] }>>();
	private characters = new Map<string, Character>();
	private spawned: Three.Group[] = [];
	private hidden = new Set<string>();
	private clock: Three.Clock;
	private room: Room | null = null;

	private yaw = 0;
	private pitch = -0.3;
	private frame = 0;
	private tweens: Tween[] = [];
	private hovered: string | null = null;
	private hinted: string | null = null;
	private pickEnabled = true;

	private pointer: {
		id: number;
		x: number;
		y: number;
		startX: number;
		startY: number;
		/** Recent drag speed in px/ms, for the glide after letting go. */
		vx: number;
		vy: number;
		t: number;
		/** Radians per pixel: faster for a finger than a mouse. */
		speed: number;
	} | null = null;
	private resizeObserver: ResizeObserver;
	private loadToken = 0;
	private disposed = false;

	/** Called with the object (and which copy of it) the player tapped. */
	onPick: (event: PickEvent) => void = () => {};
	/** Called after every render, so overlays can follow the camera. */
	onRender: () => void = () => {};
	private renderListeners = new Set<() => void>();

	constructor(
		private THREE: ThreeModule,
		private loader: GLTFLoaderType,
		private cloneSkinned: typeof CloneSkinned,
		private canvas: HTMLCanvasElement,
		private reducedMotion: boolean
	) {
		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 50);
		this.camera.rotation.order = 'YXZ';
		this.camera.position.set(0, EYE_HEIGHT, 0);
		this.raycaster = new THREE.Raycaster();
		this.clock = new THREE.Clock();

		this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7f73, 2.2));
		const sun = new THREE.DirectionalLight(0xffffff, 1.6);
		sun.position.set(2, 4, 3);
		this.scene.add(sun);

		canvas.addEventListener('pointerdown', this.handleDown);
		canvas.addEventListener('pointermove', this.handleMove);
		canvas.addEventListener('pointerup', this.handleUp);
		canvas.addEventListener('pointercancel', this.handleCancel);
		canvas.addEventListener('pointerleave', this.handleLeave);

		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(canvas);
		this.resize();
	}

	/** Builds a room, replacing the current one. Reports load progress from 0 to 1. */
	async loadRoom(room: Room, onProgress: (fraction: number) => void = () => {}) {
		const THREE = this.THREE;
		const token = ++this.loadToken;

		const urls = [
			...new Set([...room.objects.map((o) => o.model), ...room.decor.map((d) => d.model)])
		];
		let loaded = 0;
		onProgress(0);
		const templates = await Promise.all(
			urls.map((url) =>
				this.template(url).then((t) => {
					onProgress(++loaded / urls.length);
					return [url, t] as const;
				})
			)
		);
		if (token !== this.loadToken) return;
		const byUrl = new Map(templates);

		this.clearRoom();
		const group = new THREE.Group();
		group.add(this.buildShell(room));

		for (const object of room.objects) {
			object.placements.forEach((placement) => {
				const item = this.place(byUrl.get(object.model)!, placement);
				group.add(item.group);
				this.placed.push({ id: object.id, ...item });
			});
		}
		for (const decor of room.decor) {
			for (const placement of decor.placements) {
				group.add(this.place(byUrl.get(decor.model)!, placement).group);
			}
		}

		this.scene.add(group);
		this.roomGroup = group;
		this.room = room;
		group.updateMatrixWorld(true);
		this.buildProxies();

		this.camera.position.set(0, EYE_HEIGHT, 0);
		this.yaw = 0;
		this.pitch = -0.3;
		this.hovered = null;
		this.hinted = null;
		this.invalidate();
	}

	/** Allow or ignore taps (for example while the result of the last one shows). */
	setPickEnabled(enabled: boolean) {
		this.pickEnabled = enabled;
	}

	/** Re-render, so `onRender` overlays catch up with a change outside the scene. */
	refresh() {
		this.invalidate();
	}

	/** Turns the view; used for the arrow keys. */
	turn(dYaw: number, dPitch: number) {
		this.yaw += dYaw;
		this.pitch = clamp(this.pitch + dPitch, PITCH_MIN, PITCH_MAX);
		this.invalidate();
	}

	/** Where above an object a label should sit, in canvas pixels, or null when off screen. */
	labelPosition(id: string, placement = 0): { x: number; y: number } | null {
		const item = this.placed.filter((p) => p.id === id)[placement];
		if (!item) return null;
		const THREE = this.THREE;
		const point = new THREE.Vector3(
			(item.box.min.x + item.box.max.x) / 2,
			item.box.max.y,
			(item.box.min.z + item.box.max.z) / 2
		);
		point.project(this.camera);
		if (point.z > 1 || Math.abs(point.x) > 1.1 || Math.abs(point.y) > 1.1) return null;
		const { clientWidth: w, clientHeight: h } = this.canvas;
		return { x: ((point.x + 1) / 2) * w, y: ((1 - point.y) / 2) * h };
	}

	/** A short glow on every copy of an object: green for right, red (with a shake) for wrong. */
	flash(id: string, kind: Flash) {
		const items = this.placed.filter((p) => p.id === id);
		const color = new this.THREE.Color(COLORS[kind]);
		const duration = 900;
		this.animate(duration, (t) => {
			const strength = kind === 'correct' ? 1 - t * t : 1 - t;
			for (const item of items) setEmissive(item.materials, color, 0.8 * strength);
			if (kind === 'wrong' && !this.reducedMotion) {
				for (const item of items) {
					item.group.position.x = item.group.userData.x + Math.sin(t * 30) * 0.03 * (1 - t);
				}
			}
		}, () => {
			for (const item of items) {
				item.group.position.x = item.group.userData.x;
				this.restoreEmissive(item);
			}
		});
	}

	/**
	 * Points out an object: it pulses until `clearHint`, and the view turns to
	 * it. Amber when it's a hint after misses, blue when it's being taught.
	 */
	hint(id: string, tone: Spotlight = 'hint') {
		this.clearHint();
		this.hinted = id;
		const items = this.placed.filter((p) => p.id === id);
		const color = new this.THREE.Color(COLORS[tone]);
		const pulse = () => {
			if (this.hinted !== id) return;
			this.animate(1200, (t) => {
				if (this.hinted !== id) return;
				// Strong enough to read on white appliances; never fully off, so it can't be missed mid-pulse.
				const s = this.reducedMotion ? 0.8 : 0.55 + 0.35 * Math.sin(t * Math.PI);
				for (const item of items) setEmissive(item.materials, color, s);
			}, pulse);
		};
		pulse();
		if (items[0]) this.lookAt(items[0].box);
	}

	/**
	 * Which way to turn to see an object, as a screen angle in radians (0 points
	 * right, positive turns clockwise), or null when it's already in view.
	 */
	directionTo(id: string): number | null {
		const items = this.placed.filter((p) => p.id === id);
		if (!items.length) return null;
		this.camera.updateMatrixWorld();
		let best: Three.Vector3 | null = null;
		for (const item of items) {
			const local = item.box
				.getCenter(new this.THREE.Vector3())
				.applyMatrix4(this.camera.matrixWorldInverse);
			const ndc = local.clone().applyMatrix4(this.camera.projectionMatrix);
			const inView = local.z < 0 && Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.9;
			if (inView) return null;
			if (!best || local.z < best.z) best = local;
		}
		// Behind the camera, x still says which side is shorter; y is ignored so
		// the arrow points sideways rather than down at the floor.
		const behind = best!.z >= 0;
		const x = behind ? (best!.x >= 0 ? 1 : -1) : best!.x;
		const y = behind ? 0 : best!.y;
		return Math.atan2(-y, x);
	}

	clearHint() {
		const id = this.hinted;
		this.hinted = null;
		for (const item of this.placed.filter((p) => p.id === id)) this.restoreEmissive(item);
		this.invalidate();
	}

	/** Calls `listener` after every render; returns a function that stops it. */
	addRenderListener(listener: () => void): () => void {
		this.renderListeners.add(listener);
		return () => this.renderListeners.delete(listener);
	}

	// --- camera poses -------------------------------------------------------

	/** Moves the camera, gliding there unless motion is reduced. */
	setPose(pose: Pose) {
		const from = this.camera.position.clone();
		const to = new this.THREE.Vector3(...pose.at);
		const fromYaw = this.yaw;
		const fromPitch = this.pitch;
		if (this.reducedMotion) {
			this.camera.position.copy(to);
			this.yaw = pose.yaw;
			this.pitch = pose.pitch;
			this.invalidate();
			return;
		}
		this.animate(900, (t) => {
			const e = 1 - Math.pow(1 - t, 3);
			this.camera.position.lerpVectors(from, to, e);
			this.yaw = fromYaw + (pose.yaw - fromYaw) * e;
			this.pitch = fromPitch + (pose.pitch - fromPitch) * e;
		});
	}

	/** Back to standing in the middle of the room. */
	resetPose() {
		this.setPose({ at: [0, EYE_HEIGHT, 0], yaw: 0, pitch: -0.3 });
	}

	/** Turns the view to a point in the room. */
	lookAtPoint(x: number, y: number, z: number) {
		this.lookAt(new this.THREE.Box3(new this.THREE.Vector3(x, y, z), new this.THREE.Vector3(x, y, z)));
	}

	// --- objects that come and go -------------------------------------------

	/** Hides room objects (they can't be tapped either), or shows them all again with []. */
	setHidden(ids: string[]) {
		this.hidden = new Set(ids);
		for (const item of this.placed) item.group.visible = !this.hidden.has(item.id);
		this.invalidate();
	}

	/**
	 * Puts a copy of one of the room's objects somewhere new, popping in. Used
	 * for dishes the waiter brings; `clearSpawned` takes them all away.
	 */
	async spawn(id: string, placement: Placement) {
		const object = this.room?.objects.find((o) => o.id === id);
		if (!object || !this.roomGroup) return;
		const template = await this.template(object.model);
		const { group } = this.place(template, placement);
		this.roomGroup.add(group);
		this.spawned.push(group);
		const full = group.scale.clone();
		if (this.reducedMotion) return this.invalidate();
		group.scale.setScalar(0.001);
		this.animate(450, (t) => {
			const e = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
			group.scale.copy(full).multiplyScalar(Math.max(0.001, e));
		});
	}

	clearSpawned() {
		for (const group of this.spawned) {
			group.removeFromParent();
			group.traverse((node) => {
				const mesh = node as Three.Mesh;
				if (mesh.isMesh) for (const m of [mesh.material].flat()) m.dispose();
			});
		}
		this.spawned = [];
		this.invalidate();
	}

	// --- people ---------------------------------------------------------------

	/** Adds an animated person (a Kenney mini character), idling. */
	async addCharacter(key: string, url: string, placement: Placement) {
		let model = this.characterModels.get(url);
		if (!model) {
			model = this.loader.loadAsync(url).then((gltf) => ({
				scene: gltf.scene,
				clips: gltf.animations
			}));
			this.characterModels.set(url, model);
		}
		const { scene, clips } = await model;
		this.removeCharacter(key);

		const group = new this.THREE.Group();
		// Skinned meshes need SkeletonUtils' clone; Object3D.clone would share the skeleton.
		group.add(this.cloneSkinned(scene));
		const [x, y, z] = placement.at;
		group.position.set(x, y, z);
		group.rotation.y = ((placement.rot ?? 0) * Math.PI) / 180;
		group.scale.setScalar(typeof placement.scale === 'number' ? placement.scale : 1);
		this.scene.add(group);

		const mixer = new this.THREE.AnimationMixer(group);
		const actions = new Map(clips.map((clip) => [clip.name, mixer.clipAction(clip)]));
		const character: Character = { group, mixer, actions, current: null, walk: 0 };
		this.characters.set(key, character);
		this.playAnimation(key, 'idle');
		this.invalidate();
	}

	removeCharacter(key: string) {
		const character = this.characters.get(key);
		if (!character) return;
		character.mixer.stopAllAction();
		character.group.removeFromParent();
		this.characters.delete(key);
		this.invalidate();
	}

	clearCharacters() {
		for (const key of [...this.characters.keys()]) this.removeCharacter(key);
	}

	/**
	 * Plays one of the character's clips (idle, walk, sit, emote-yes,
	 * holding-both, interact-right…), crossfading. A `once` clip resolves when
	 * it ends and falls back to `then`.
	 */
	playAnimation(key: string, name: string, options: { once?: boolean; then?: string } = {}) {
		const character = this.characters.get(key);
		const action = character?.actions.get(name);
		if (!character || !action) return Promise.resolve();
		const previous = character.current;
		action.reset();
		action.setLoop(
			options.once ? this.THREE.LoopOnce : this.THREE.LoopRepeat,
			options.once ? 1 : Infinity
		);
		action.clampWhenFinished = !!options.once;
		action.play();
		if (previous && previous !== action) previous.crossFadeTo(action, 0.25, false);
		character.current = action;
		this.invalidate();
		if (!options.once) return Promise.resolve();
		return new Promise<void>((resolve) => {
			const done = (event: { action: Three.AnimationAction }) => {
				if (event.action !== action) return;
				character.mixer.removeEventListener('finished', done);
				if (options.then && character.current === action) this.playAnimation(key, options.then);
				resolve();
			};
			character.mixer.addEventListener('finished', done);
		});
	}

	/** Walks a character through points on the floor, then idles. */
	walkTo(key: string, path: [number, number][]) {
		const character = this.characters.get(key);
		if (!character || !path.length) return Promise.resolve();
		const walk = ++character.walk;
		const group = character.group;
		this.playAnimation(key, 'walk');

		const legs: { from: Three.Vector3; to: Three.Vector3 }[] = [];
		let from = group.position.clone();
		for (const [x, z] of path) {
			const to = new this.THREE.Vector3(x, group.position.y, z);
			legs.push({ from, to });
			from = to;
		}

		return legs
			.reduce(
				(chain, leg) =>
					chain.then(
						() =>
							new Promise<void>((resolve) => {
								if (character.walk !== walk) return resolve();
								const distance = leg.from.distanceTo(leg.to);
								group.rotation.y = Math.atan2(leg.to.x - leg.from.x, leg.to.z - leg.from.z);
								if (this.reducedMotion || distance < 0.01) {
									group.position.copy(leg.to);
									return resolve();
								}
								this.animate(
									(distance / WALK_SPEED) * 1000,
									(t) => {
										if (character.walk === walk) group.position.lerpVectors(leg.from, leg.to, t);
									},
									resolve
								);
							})
					),
				Promise.resolve()
			)
			.then(() => {
				if (character.walk === walk) this.playAnimation(key, 'idle');
			});
	}

	/** Turns a character to face a point on the floor. */
	faceCharacter(key: string, x: number, z: number) {
		const group = this.characters.get(key)?.group;
		if (!group) return;
		group.rotation.y = Math.atan2(x - group.position.x, z - group.position.z);
		this.invalidate();
	}

	setCharacterVisible(key: string, visible: boolean) {
		const group = this.characters.get(key)?.group;
		if (group) group.visible = visible;
		this.invalidate();
	}

	dispose() {
		this.loadToken++;
		this.clearCharacters();
		// Late calls (an overlay tidying up after us) must not draw with a freed renderer.
		this.disposed = true;
		cancelAnimationFrame(this.frame);
		this.resizeObserver.disconnect();
		const c = this.canvas;
		c.removeEventListener('pointerdown', this.handleDown);
		c.removeEventListener('pointermove', this.handleMove);
		c.removeEventListener('pointerup', this.handleUp);
		c.removeEventListener('pointercancel', this.handleCancel);
		c.removeEventListener('pointerleave', this.handleLeave);
		this.clearRoom();
		for (const template of this.templates.values()) {
			template.then((t) => disposeTree(t)).catch(() => {});
		}
		this.templates.clear();
		this.renderer.dispose();
	}

	// --- building -----------------------------------------------------------

	private template(url: string): Promise<Three.Group> {
		let template = this.templates.get(url);
		if (!template) {
			template = this.loader.loadAsync(url).then((gltf) => {
				// Centre the model on its footprint with its base at y = 0.
				const box = new this.THREE.Box3().setFromObject(gltf.scene);
				const centre = box.getCenter(new this.THREE.Vector3());
				gltf.scene.position.set(-centre.x, -box.min.y, -centre.z);
				// Copies share this geometry; clearRoom must leave it alone.
				gltf.scene.traverse((node) => (node.userData.shared = true));
				const wrapper = new this.THREE.Group();
				wrapper.add(gltf.scene);
				return wrapper;
			});
			this.templates.set(url, template);
		}
		return template;
	}

	private place(template: Three.Group, placement: Placement) {
		const group = template.clone(true);
		const materials: Three.MeshStandardMaterial[] = [];
		// Each copy gets its own materials, so one object can glow on its own.
		group.traverse((node) => {
			const mesh = node as Three.Mesh;
			if (!mesh.isMesh) return;
			const own = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => {
				const copy = m.clone();
				if ('emissive' in copy) {
					const std = copy as Three.MeshStandardMaterial;
					std.userData.emissive = std.emissive.clone();
					std.userData.emissiveIntensity = std.emissiveIntensity;
					materials.push(std);
				}
				return copy;
			});
			mesh.material = Array.isArray(mesh.material) ? own : own[0];
		});

		const [x, y, z] = placement.at;
		group.position.set(x, y, z);
		group.userData.x = x;
		group.rotation.y = ((placement.rot ?? 0) * Math.PI) / 180;
		const s = placement.scale ?? 1;
		if (typeof s === 'number') group.scale.setScalar(s);
		else group.scale.set(...s);
		group.updateMatrixWorld(true);

		return { group, box: new this.THREE.Box3().setFromObject(group), materials };
	}

	private buildShell(room: Room) {
		const THREE = this.THREE;
		const [w, d] = room.size;
		const h = room.height;
		const shell = new THREE.Group();
		const floorMat = new THREE.MeshStandardMaterial({ color: room.colors.floor, roughness: 1 });
		const wallMat = new THREE.MeshStandardMaterial({ color: room.colors.wall, roughness: 1 });
		const ceilingMat = new THREE.MeshStandardMaterial({ color: '#fbf8f3', roughness: 1 });

		const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
		floor.rotation.x = -Math.PI / 2;
		shell.add(floor);

		const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilingMat);
		ceiling.rotation.x = Math.PI / 2;
		ceiling.position.y = h;
		shell.add(ceiling);

		const walls: [number, number, number, number][] = [
			// width, x, z, rotation — each plane faces into the room.
			[w, 0, -d / 2, 0],
			[w, 0, d / 2, Math.PI],
			[d, -w / 2, 0, Math.PI / 2],
			[d, w / 2, 0, -Math.PI / 2]
		];
		for (const [width, x, z, rot] of walls) {
			const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, h), wallMat);
			wall.position.set(x, h / 2, z);
			wall.rotation.y = rot;
			shell.add(wall);
		}

		// A darker skirting line so the walls read as walls.
		const skirtingMat = new THREE.MeshStandardMaterial({ color: room.colors.floor, roughness: 1 });
		for (const [width, x, z, rot] of walls) {
			const skirting = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.1), skirtingMat);
			skirting.position.set(x * 0.999, 0.05, z * 0.999);
			skirting.rotation.y = rot;
			shell.add(skirting);
		}
		return shell;
	}

	private buildProxies() {
		const THREE = this.THREE;
		const material = new THREE.MeshBasicMaterial({ visible: false });
		this.proxies = this.placed.map((item, i) => {
			const size = item.box.getSize(new THREE.Vector3());
			const centre = item.box.getCenter(new THREE.Vector3());
			const proxy = new THREE.Mesh(
				new THREE.BoxGeometry(
					Math.max(size.x, MIN_TARGET),
					Math.max(size.y, MIN_TARGET),
					Math.max(size.z, MIN_TARGET)
				),
				material
			);
			proxy.position.copy(centre);
			proxy.userData.index = i;
			this.roomGroup!.add(proxy);
			proxy.updateMatrixWorld();
			return proxy;
		});
	}

	private clearRoom() {
		if (this.roomGroup) {
			this.scene.remove(this.roomGroup);
			// Geometry in the model copies is shared with the cached templates, so
			// only the materials (cloned per copy) and the shell/proxies are freed here.
			this.roomGroup.traverse((node) => {
				const mesh = node as Three.Mesh;
				if (!mesh.isMesh) return;
				for (const m of [mesh.material].flat()) m.dispose();
				if (!mesh.userData.shared) mesh.geometry.dispose();
			});
		}
		this.roomGroup = null;
		this.placed = [];
		this.proxies = [];
		this.tweens = [];
		// Spawned copies lived in the room group and were freed with it.
		this.spawned = [];
		this.hidden.clear();
	}

	// --- input --------------------------------------------------------------

	private handleDown = (event: PointerEvent) => {
		if (event.button !== 0 || this.pointer) return;
		this.canvas.setPointerCapture(event.pointerId);
		this.glide = null;
		this.pointer = {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			startX: event.clientX,
			startY: event.clientY,
			vx: 0,
			vy: 0,
			t: event.timeStamp,
			speed: event.pointerType === 'touch' ? TOUCH_DRAG_SPEED : DRAG_SPEED
		};
	};

	private handleMove = (event: PointerEvent) => {
		const p = this.pointer;
		if (p && p.id === event.pointerId) {
			const dx = event.clientX - p.x;
			const dy = event.clientY - p.y;
			const dt = Math.max(1, event.timeStamp - p.t);
			p.vx = 0.7 * (dx / dt) + 0.3 * p.vx;
			p.vy = 0.7 * (dy / dt) + 0.3 * p.vy;
			p.t = event.timeStamp;
			this.turn(dx * p.speed, dy * p.speed);
			p.x = event.clientX;
			p.y = event.clientY;
			return;
		}
		if (event.pointerType === 'mouse') this.setHover(this.hit(event)?.id ?? null);
	};

	private handleUp = (event: PointerEvent) => {
		const p = this.pointer;
		if (!p || p.id !== event.pointerId) return;
		this.pointer = null;
		const moved = Math.hypot(event.clientX - p.startX, event.clientY - p.startY);
		if (moved > TAP_SLOP) {
			// Keep turning a little after a flick, unless the finger stopped first.
			const fresh = event.timeStamp - p.t < 80;
			if (fresh && !this.reducedMotion) this.startGlide(p.vx, p.vy, p.speed);
			return;
		}
		if (!this.pickEnabled) return;
		const hit = this.hit(event);
		if (hit) this.onPick(hit);
	};

	private handleCancel = () => {
		this.pointer = null;
	};

	private handleLeave = (event: PointerEvent) => {
		if (event.pointerType === 'mouse') this.setHover(null);
	};

	private hit(event: PointerEvent): PickEvent | null {
		const rect = this.canvas.getBoundingClientRect();
		const ndc = new this.THREE.Vector2(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		this.raycaster.setFromCamera(ndc, this.camera);
		const first = this.raycaster
			.intersectObjects(this.proxies, false)
			.find((hit) => !this.hidden.has(this.placed[hit.object.userData.index as number].id));
		if (!first) return null;
		const item = this.placed[first.object.userData.index as number];
		const copies = this.placed.filter((p) => p.id === item.id);
		return { id: item.id, placement: copies.indexOf(item) };
	}

	private setHover(id: string | null) {
		if (id === this.hovered) return;
		const previous = this.hovered;
		this.hovered = id;
		this.canvas.style.cursor = id ? 'pointer' : 'grab';
		for (const item of this.placed) {
			if (item.id === previous || item.id === id) this.restoreEmissive(item);
		}
		this.invalidate();
	}

	/** The resting glow of an object: hint beats hover beats none. */
	private restoreEmissive(item: Placed) {
		if (item.id === this.hinted) return;
		if (item.id === this.hovered && this.pickEnabled) {
			setEmissive(item.materials, new this.THREE.Color(COLORS.hover), 1);
			return;
		}
		for (const m of item.materials) {
			m.emissive.copy(m.userData.emissive);
			m.emissiveIntensity = m.userData.emissiveIntensity;
		}
	}

	// --- camera and rendering -----------------------------------------------

	private glide: { vx: number; vy: number } | null = null;

	private startGlide(vx: number, vy: number, speed: number) {
		if (Math.hypot(vx, vy) < 0.15) return;
		const glide = { vx, vy };
		this.glide = glide;
		this.animate(400, (t) => {
			if (this.glide !== glide) return;
			const k = (1 - t) * 6 * speed;
			this.yaw += glide.vx * k;
			this.pitch = clamp(this.pitch + glide.vy * k, PITCH_MIN, PITCH_MAX);
		});
	}

	private lookAt(box: Three.Box3) {
		const centre = box.getCenter(new this.THREE.Vector3());
		const dx = centre.x - this.camera.position.x;
		const dy = centre.y - this.camera.position.y;
		const dz = centre.z - this.camera.position.z;
		// The camera looks down -z at yaw 0.
		let targetYaw = Math.atan2(-dx, -dz);
		const targetPitch = clamp(Math.atan2(dy, Math.hypot(dx, dz)), PITCH_MIN, PITCH_MAX);
		// Take the short way round.
		while (targetYaw - this.yaw > Math.PI) targetYaw -= Math.PI * 2;
		while (targetYaw - this.yaw < -Math.PI) targetYaw += Math.PI * 2;

		if (this.reducedMotion) {
			this.yaw = targetYaw;
			this.pitch = targetPitch;
			this.invalidate();
			return;
		}
		const fromYaw = this.yaw;
		const fromPitch = this.pitch;
		this.animate(600, (t) => {
			const e = 1 - Math.pow(1 - t, 3);
			this.yaw = fromYaw + (targetYaw - fromYaw) * e;
			this.pitch = fromPitch + (targetPitch - fromPitch) * e;
		});
	}

	private resize() {
		const { clientWidth: w, clientHeight: h } = this.canvas;
		if (!w || !h) return;
		this.renderer.setSize(w, h, false);
		this.camera.aspect = w / h;
		// Portrait phones see too little sideways at 60°.
		this.camera.fov = w / h < 1 ? 75 : 60;
		this.camera.updateProjectionMatrix();
		this.invalidate();
	}

	private animate(duration: number, step: (t: number) => void, done?: () => void) {
		this.tweens.push({ start: performance.now(), duration, step, done });
		this.invalidate();
	}

	private invalidate() {
		if (!this.frame && !this.disposed) this.frame = requestAnimationFrame(this.tick);
	}

	private tick = (now: number) => {
		this.frame = 0;
		const running = this.tweens;
		this.tweens = [];
		for (const tween of running) {
			const t = Math.min(1, (now - tween.start) / tween.duration);
			tween.step(t);
			if (t < 1) this.tweens.push(tween);
			else tween.done?.();
		}

		const delta = this.clock.getDelta();
		for (const character of this.characters.values()) character.mixer.update(delta);

		this.camera.rotation.set(this.pitch, this.yaw, 0);
		this.renderer.render(this.scene, this.camera);
		this.onRender();
		for (const listener of this.renderListeners) listener();

		// People move every frame; an empty room only redraws when something changes.
		if (this.tweens.length || this.characters.size) this.invalidate();
	};
}

function setEmissive(materials: Three.MeshStandardMaterial[], color: Three.Color, intensity: number) {
	for (const m of materials) {
		m.emissive.copy(color);
		m.emissiveIntensity = intensity;
	}
}

function disposeTree(root: Three.Object3D) {
	root.traverse((node) => {
		const mesh = node as Three.Mesh;
		if (!mesh.isMesh) return;
		mesh.geometry.dispose();
		for (const m of [mesh.material].flat()) {
			for (const value of Object.values(m)) {
				if (value && typeof value === 'object' && 'isTexture' in value) value.dispose();
			}
			m.dispose();
		}
	});
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}
