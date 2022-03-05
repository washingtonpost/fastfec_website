<script lang="ts">
	import { onMount } from 'svelte';
	import { animating, getTableId, tableAnimations } from './tablelock';
	import { cubicInOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';
	import AnimatedTable from './animatedTable.svelte';

	const dispatch = createEventDispatcher();

	export let rows: string[][];
	export let demo = false;
	export let expanded = false;
	export let cutoffRows: number;
	export let ROWS_TO_SHOW = 10;

	export let shouldAnimate = true;

	function handleExpand() {
		shouldAnimate = false;
		ROWS_TO_SHOW = cutoffRows;
	}
</script>

{#key shouldAnimate}
	<AnimatedTable
		on:animated
		on:expand={handleExpand}
		{shouldAnimate}
		{rows}
		{demo}
		{expanded}
		{cutoffRows}
		{ROWS_TO_SHOW}
	/>
{/key}
