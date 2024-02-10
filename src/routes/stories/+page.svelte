<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
  console.log({ data });

  const { stories } = data;
</script>

<section class="border border-red-100 h-full">
  <h1 class="text-2xl font-bold">Stories</h1>
  <ul>
    {#each stories as story}
      <li>
        <article class="border h-[400px] w-[350px] bg-blue-400">
          <a href={`/story/${story.id}`}>{story.title}</a>
        </article>
      </li>
    {/each}
  </ul>
</section>