<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let recipientType = $state('all');
	let customEmail = $state('');
	let subject = $state('');
	let message = $state('');
	let isLoading = $state(false);

	function getRecipientCount() {
		if (recipientType === 'all') return data.userCount;
		if (recipientType === 'subscribers') return data.subscriberCount;
		if (recipientType === 'custom') return 1;
		return 0;
	}

	function handleSubmit(event) {
    console.log({ event })
		isLoading = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			isLoading = false;
		};
	}
</script>

<div class="p-6 space-y-8">
	<!-- Header -->
	<div class="text-center space-y-2">
		<h1 class="text-4xl font-bold text-text-300">Email Sender</h1>
		<p class="text-text-200 text-lg">Send emails to your users</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Total Users</p>
					<p class="text-3xl font-bold text-text-300">{data.userCount}</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">👥</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Active Subscribers</p>
					<p class="text-3xl font-bold text-text-300">{data.subscriberCount}</p>
					<p class="text-text-200 text-xs">
						({((data.subscriberCount / data.userCount) * 100).toFixed(1)}% of users)
					</p>
				</div>
				<div class="w-12 h-12 bg-green1 rounded-lg flex items-center justify-center">
					<span class="text-2xl">⭐</span>
				</div>
			</div>
		</div>

		<div class="bg-tile-300 border-2 border-tile-600 p-6 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-text-200 text-sm font-medium">Recipients</p>
					<p class="text-3xl font-bold text-text-300">{getRecipientCount()}</p>
					<p class="text-text-200 text-xs">Will receive this email</p>
				</div>
				<div class="w-12 h-12 bg-tile-500 rounded-lg flex items-center justify-center">
					<span class="text-2xl">📧</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="bg-green1 border border-green-400 text-text-300 px-4 py-3 rounded">
			✅ {form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-500 border border-red-400 text-white px-4 py-3 rounded">
			❌ {form.error}
		</div>
	{/if}

	<!-- Email Composer -->
	<div class="bg-tile-300 border-2 border-tile-600 rounded-lg overflow-hidden">
		<div class="p-6 border-b border-tile-600">
			<h2 class="text-2xl font-bold text-text-300">Compose Email</h2>
			<p class="text-text-200 mt-1">Send targeted emails to your user base</p>
		</div>

		<form method="POST" action="?/sendEmail" use:enhance={handleSubmit} class="p-6 space-y-6">
			<!-- Recipient Selection -->
			<div class="space-y-4">
				<label class="block text-sm font-medium text-text-300">Recipients</label>
				
				<div class="space-y-3">
					<label class="flex items-center space-x-3 cursor-pointer">
						<input 
							type="radio" 
							bind:group={recipientType} 
							value="all" 
							name="recipientType"
							class="form-radio h-4 w-4 text-brand bg-tile-400 border-tile-600 focus:ring-brand focus:ring-offset-0"
						>
						<span class="text-text-300">All Users ({data.userCount})</span>
					</label>

					<label class="flex items-center space-x-3 cursor-pointer">
						<input 
							type="radio" 
							bind:group={recipientType} 
							value="subscribers" 
							name="recipientType"
							class="form-radio h-4 w-4 text-brand bg-tile-400 border-tile-600 focus:ring-brand focus:ring-offset-0"
						>
						<span class="text-text-300">Active Subscribers Only ({data.subscriberCount})</span>
					</label>

					<div class="flex items-start space-x-3">
						<input 
							type="radio" 
							bind:group={recipientType} 
							value="custom" 
							name="recipientType"
							class="form-radio h-4 w-4 text-brand bg-tile-400 border-tile-600 focus:ring-brand focus:ring-offset-0 mt-1"
						>
						<div class="flex-1 space-y-2">
							<span class="text-text-300">Custom Email Address</span>
							<input 
								type="email" 
								bind:value={customEmail}
								name="customEmail"
								placeholder="Enter email address..."
								disabled={recipientType !== 'custom'}
								class="w-full px-3 py-2 bg-tile-400 border border-tile-600 rounded-md text-text-300 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Subject Line -->
			<div class="space-y-2">
				<label for="subject" class="block text-sm font-medium text-text-300">Subject Line</label>
				<input 
					type="text" 
					id="subject"
					name="subject"
					bind:value={subject}
					placeholder="Enter email subject..."
					required
					class="w-full px-3 py-2 bg-tile-400 border border-tile-600 rounded-md text-text-300 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
				>
			</div>

			<!-- Message Body -->
			<div class="space-y-2">
				<label for="message" class="block text-sm font-medium text-text-300">Message</label>
				<textarea 
					id="message"
					name="message"
					bind:value={message}
					placeholder="Type your email message here..."
					required
					rows="8"
					class="w-full px-3 py-2 bg-tile-400 border border-tile-600 rounded-md text-text-300 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-vertical"
				></textarea>
				<p class="text-xs text-text-200">
					You can use line breaks for formatting. HTML tags are not supported.
				</p>
			</div>

			<!-- Send Button -->
			<div class="flex items-center justify-between pt-4 border-t border-tile-600">
				<div class="text-sm text-text-200">
					Ready to send to <strong class="text-text-300">{getRecipientCount()}</strong> 
					{getRecipientCount() === 1 ? 'recipient' : 'recipients'}
				</div>
				
				<button 
					type="submit"
					disabled={isLoading || !subject.trim() || !message.trim() || (recipientType === 'custom' && !customEmail.trim())}
					class="px-6 py-2 bg-brand text-white font-medium rounded-md hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-tile-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						<span class="flex items-center space-x-2">
							<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Sending...</span>
						</span>
					{:else}
						Send Email
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Preview Section -->
	{#if subject.trim() || message.trim()}
		<div class="bg-tile-300 border-2 border-tile-600 rounded-lg overflow-hidden">
			<div class="p-6 border-b border-tile-600">
				<h2 class="text-2xl font-bold text-text-300">Email Preview</h2>
				<p class="text-text-200 mt-1">How your email will appear to recipients</p>
			</div>
			
			<div class="p-6">
				<div class="bg-white border border-gray-300 rounded-lg shadow-sm max-w-2xl">
					<div class="p-4 border-b border-gray-200 bg-gray-50">
						<div class="flex items-center justify-between">
							<div class="text-sm text-gray-600">From: Parallel Arabic</div>
							<div class="text-sm text-gray-600">To: Recipients</div>
						</div>
					</div>
					<div class="p-4 space-y-4">
						{#if subject.trim()}
							<div>
								<div class="text-sm font-medium text-gray-700 mb-1">Subject:</div>
								<div class="text-lg font-semibold text-gray-900">{subject}</div>
							</div>
						{/if}
						{#if message.trim()}
							<div>
								<div class="text-sm font-medium text-gray-700 mb-2">Message:</div>
								<div class="text-gray-900 whitespace-pre-line">{message}</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom radio button styling */
	.form-radio:checked {
		background-color: var(--brand);
		border-color: var(--brand);
	}
	
	.form-radio {
		appearance: none;
		background-color: var(--tile4);
		border: 2px solid var(--tile6);
		border-radius: 50%;
		display: inline-block;
		position: relative;
	}
	
	.form-radio:checked::after {
		content: '';
		display: block;
		position: absolute;
		top: 50%;
		left: 50%;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: white;
		transform: translate(-50%, -50%);
	}
</style>
