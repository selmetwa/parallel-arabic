<script lang="ts">
    import { goto } from '$app/navigation';
    import SelfStudyPlayer from '$lib/components/SelfStudyPlayer.svelte';

    let { data } = $props();

    function closeSession() {
        goto('/profile');
    }
</script>

<SelfStudyPlayer
    session={data.session}
    sessionId={data.sessionId}
    onClose={closeSession}
    user={data.user}
/>
