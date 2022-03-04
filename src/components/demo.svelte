<script lang="ts">
	import { Randomizer } from '../util/randomFecFile';
	import FECTable from './fectable.svelte';

	const randomizer = new Randomizer();
	let form = randomizer.getRandomForm();

	function nextForm() {
		form = randomizer.getRandomForm();
	}
</script>

<div class="demo">
	{#key form}
		<FECTable rows={form} demo={true} on:animated={nextForm} />
	{/key}
</div>

<style>
	.demo {
		height: 200px;
		overflow-y: auto;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.12);
	}
</style>
