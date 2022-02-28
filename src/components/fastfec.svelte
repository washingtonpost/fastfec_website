<script lang="ts">
	import { CSVReader } from '../util/csv';

	import { onMount } from 'svelte';
	import FECTable from './fectable.svelte';
	import Tabs from './tabs.svelte';
	import Progress from './progress.svelte';

	interface WriteMessage {
		type: 'write';
		filename: string;
		contents: Uint8Array;
	}

	interface ProgressMessage {
		type: 'progress';
		pos: number;
		len: number;
		fileProgress: {
			[filename: string]: number;
		};
	}

	interface DoneMessage {
		type: 'done';
	}

	type Message = WriteMessage | ProgressMessage | DoneMessage;

	const csvs: { [filename: string]: CSVReader } = {};

	let progress = 0;
	let done = false;

	const CUTOFF_ROWS = 100;

	function handleMessage(e: { data: Message }) {
		if (e.data.type == 'write') {
			const filename = e.data.filename;
			if (csvs[filename] == null) {
				csvs[filename] = new CSVReader(CUTOFF_ROWS);
			}
			csvs[filename].processData(e.data.contents);
		} else if (e.data.type == 'progress') {
			progress = e.data.pos / e.data.len;
		} else if (e.data.type == 'done') {
			done = true;
		}
	}

	function handleFiles(e: Event) {
		const files = (<HTMLInputElement>e.target).files;
		if (files.length == 1) {
			// Create a web worker
			const worker = new Worker('/fastfec/worker.js');
			worker.addEventListener('message', handleMessage);
			worker.postMessage({ file: files[0] });
		}
	}

	onMount(async () => {
		// const request = await fetch('/fastfec/13425.fec');
		// const request = await fetch('/fastfec/1500199.fec');
		// const request = await fetch('/fastfec/1482832.fec');
		// const buffer = await request.arrayBuffer();
		// console.log('GOT', buffer);
		// // Create a web worker
		// const worker = new Worker('/fastfec/worker.js');
		// worker.addEventListener('message', handleMessage);
		// worker.postMessage({ file: new Blob([buffer]) });
	});
</script>

<input on:input={handleFiles} type="file" />

<Tabs dict={csvs} component={FECTable} accessor={(x) => ({ rows: x.rows })} extraProps={{ done }}>
	<Progress {progress} {done} />
</Tabs>

<style>
	input {
		background: rgb(233, 233, 233);
		color: #35639b;
		border-radius: 10px;
		padding: 2px 8px;
		border: none;
		font-size: 12px;
		margin: 0 5px;
		margin-bottom: 12px;
	}
</style>
