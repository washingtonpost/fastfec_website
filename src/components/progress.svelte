<script lang="ts">
	export let progress = 0;
	export let done = false;
</script>

<div class="bar">
	<div class="fill" class:done style:width={`${progress * 100}%`} />
</div>

<style>
	.bar {
		height: 2px;
		background: white;
		position: relative;
	}

	.fill {
		background: gainsboro;
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		transition: width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.fill.done {
		background: #35639b;
	}
</style>
