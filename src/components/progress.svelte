<script lang="ts">
	export let progress: number = 0;
	export let done: boolean = false;
</script>

<div class="bar" class:done>
	<div class="fill" style:width={`${progress * 100}%`} />
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
</style>
