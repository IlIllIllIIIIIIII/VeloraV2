<script>
	let hostname = $state('');
	let loading = $state(false);
	let result = $state(null);
	let error = $state('');

	async function addDomain() {
		loading = true;
		error = '';
		result = null;

		try {
			const response = await fetch('/api/byod', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ hostname })
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				error = data.error || 'Could not add domain';
				return;
			}

			result = data;
		} catch {
			error = 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Bring Your Own Domain — Velora</title>
</svelte:head>

<h1>Bring Your Own Domain</h1>

<p>Enter the full domain you want to use with Velora.</p>

<input
	bind:value={hostname}
	placeholder="www.example.com"
/>

<button onclick={addDomain} disabled={loading || !hostname}>
	{loading ? 'Adding...' : 'Add Domain'}
</button>

{#if error}
	<p>{error}</p>
{/if}

{#if result}
	<h2>Almost done!</h2>

	<p>Go to your domain's DNS settings and add:</p>

	<pre>Type: CNAME
Name: {result.hostname.split('.')[0]}
Target: customers.formative.icu</pre>

	<p>Leave TTL on Auto/Default.</p>
{/if}