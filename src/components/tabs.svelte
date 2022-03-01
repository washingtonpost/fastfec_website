<script lang="ts">
	/* eslint-disable  @typescript-eslint/no-explicit-any */
	export let dict: { [key: string]: any };
	export let component;
	export let accessor = (x) => x;
	export let extraProps = {};

	$: keys = Object.keys(dict);
	let selected = null;

	$: {
		if (selected == null && keys != null && keys.length > 0) {
			selected = keys[0];
		}
	}
</script>

<div class="tabs">
	{#each keys as key}
		<div class="tab" class:selected={selected == key} on:click={() => (selected = key)}>{key}</div>
	{/each}
</div>
<slot />
{#if selected != null}
	<div class="container">
		{#key selected}
			<svelte:component this={component} {...accessor(dict[selected])} {...extraProps} />
		{/key}
	</div>
{/if}

<style>
	.tab {
		display: inline-block;
		user-select: none;
		padding: 3px 10px;
		border-bottom: solid 2px transparent;
		color: #35639b;
		font-size: 14px;
	}

	.tab.selected {
		background: #35639b;
		color: white;
	}

	.container {
		padding: 10px;
		overflow-x: auto;
	}
</style>
