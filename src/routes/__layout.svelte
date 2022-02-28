<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Barlow&display=swap" rel="stylesheet" />
</svelte:head>

<div class="logo">
	<img alt="FastFEC logo" src="fastfec.png" />
</div>

<slot />

<style>
	:global(body) {
		font-family: 'Barlow', sans-serif;
	}

	img {
		width: 150px;
	}

	.logo {
		margin: 12px 0;
	}
</style>
