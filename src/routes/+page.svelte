<script>
  import { story } from "../stories/omar-and-sarah.js"
  import { convertStory } from "../helpers/convert-to-story.js"
  console.log({ story })
  const res = convertStory(story);
  console.log({ res })
</script>
<h1 class="font-sans text-3xl text-raison">Welcome</h1>
<arabic-keyboard></arabic-keyboard>

