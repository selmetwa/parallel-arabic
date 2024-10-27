<script>
	let { src } = $props();

	let time = $state(0);
	let duration = $state(0);
	let paused = $state(true);

	function format(time) {
		if (isNaN(time)) return '...';

		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);

		return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
	}
</script>

<div class="player" class:paused>
	<audio
		{src}
		bind:currentTime={time}
		bind:duration
		bind:paused
		preload="metadata"
		onended={() => {
			time = 0;
		}}
	></audio>
	
	<button
		class="play"
		aria-label={paused ? 'play' : 'pause'}
		onclick={() => paused = !paused}
	></button>

	<div class="info">
		<div class="description">
		</div>

		<div class="time">
			<span>{format(time)}</span>
			<div
				class="slider"
				onpointerdown={e => {
					const div = e.currentTarget;
					
					function seek(e) {
						const { left, width } = div.getBoundingClientRect();

						let p = (e.clientX - left) / width;
						if (p < 0) p = 0;
						if (p > 1) p = 1;
						
						time = p * duration;
					}

					seek(e);

					window.addEventListener('pointermove', seek);

					window.addEventListener('pointerup', () => {
						window.removeEventListener('pointermove', seek);
					}, {
						once: true
					});
				}}
			>
				<div class="progress" style="--progress: {time / duration}%"></div>
			</div>
			<span>{duration ? format(duration) : '--:--'}</span>
		</div>
	</div>
</div>

<style>
	.player {
		display: grid;
		grid-template-columns: 2.5em 1fr;
		align-items: center;
		gap: 0.75em;
		/* padding: 0.5em 1em 0.5em 0.5em; */
		border-radius: 2em;
		transition: filter 0.2s;
		color: var(--text2);
		user-select: none;
	}

	.player:not(.paused) {
		color: var(--text3);
	}
	
	button {
		width: 100%;
		aspect-ratio: 1;
		background-repeat: no-repeat;
		background-position: 50% 50%;
		border-radius: 50%;
	}
	
	[aria-label="pause"] {
		background-image: url(../icons/pause.svg);
	}

	[aria-label="play"] {
		background-image: url(../icons/play.svg);
	}

  .play {
    background-color: var(--tile4);
  }
	.info {
		overflow: hidden;
	}

	.description {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.2;
	}

	.time {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.time span {
		font-size: 0.7em;
	}

	.slider {
		flex: 1;
		height: 0.75em;
		background: var(--tile4);
		overflow: hidden;
	}

	.progress {
		width: calc(100 * var(--progress));
		height: 100%;
		background: var(--tile6);
	}
</style>