<script lang="ts">
	import { assets } from '$app/paths';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Barlow&display=swap" rel="stylesheet" />
</svelte:head>

<div class="logo">
	<a href={assets}>
		<img alt="FastFEC logo" src={`${assets}/fastfec.png`} />
	</a>
</div>

<slot />

<style>
	:global(body) {
		font-family: 'Barlow', sans-serif;
		margin: 1em 2em 3em 2em;
	}

	:global(p, h1, h2, h3, h4, ul, li, fieldset) {
		max-width: 650px;
	}

	:global(code) {
		color: #a93b30;
	}

	img {
		width: 150px;
	}

	.logo {
		margin: 25px -5px;
	}

	:global(fieldset) {
		margin: 1em 0;
		font-size: 14px;
		border: solid 1px gainsboro;
	}
</style>
