<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Barlow&display=swap" rel="stylesheet" />
</svelte:head>

<img alt="FastFEC logo" src="fastfec.png" />
<nav>
	<a href="/">Home</a>
</nav>

<slot />

<style>
	:global(body) {
		font-family: 'Barlow', sans-serif;
	}

	img {
		width: 150px;
	}
</style>
