<script lang="ts">
	import FastFEC from '../components/fastfec.svelte';
	import { localGetBool, localSet } from '../util/local';

	const AUTO_DOWNLOAD = 'autodownload';
	const SHOULD_ANIMATE = 'shouldanimate';

	let autoDownload = localGetBool(AUTO_DOWNLOAD, true);
	let shouldAnimate = localGetBool(SHOULD_ANIMATE, true);

	$: {
		// Update local storage state
		localSet(AUTO_DOWNLOAD, autoDownload);
		localSet(SHOULD_ANIMATE, shouldAnimate);
	}
</script>

<p>
	Upload a .fec file to parse it and download a zip of .csv files entirely in-browser using
	WebAssembly.
</p>
<p>
	This demo is about 2-3x slower than the native command-line tool but still fast and usable. There
	is no installation required and no size limit.
</p>

<FastFEC {autoDownload} {shouldAnimate} expanded={true} />

<fieldset>
	<legend>Options</legend>
	<div>
		<label><input type="checkbox" bind:checked={autoDownload} /> Download zip</label>
	</div>
	<div><label><input type="checkbox" bind:checked={shouldAnimate} /> Show animations</label></div>
</fieldset>
