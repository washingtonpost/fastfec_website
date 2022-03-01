<script lang="ts">
	import { CSVReader } from '../util/csv';

	import { onMount } from 'svelte';
	import FECTable from './fectable.svelte';
	import Tabs from './tabs.svelte';
	import Progress from './progress.svelte';
	import FastFECWorker from '../worker/fastfec?worker';
	import { Writer } from '../worker/writer';

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

	let writer: Writer;
	let prefix: string | null = null;

	/**
	 * Extracts the numeric part of a filename (to determine its filing
	 * id, if present). Returns null if not found.
	 */
	function getPrefix(file: File): string {
		const regexResults = /[0-9]+/.exec(file.name);
		if (regexResults == null) {
			return null;
		}
		return regexResults[0];
	}

	function handleMessage(e: { data: Message }) {
		if (e.data.type == 'write') {
			const filename = e.data.filename;
			if (csvs[filename] == null) {
				csvs[filename] = new CSVReader(CUTOFF_ROWS);
			}
			csvs[filename].processData(e.data.contents);
			// Download the file
			writer.writeFile(
				prefix == null ? e.data.filename : `${prefix}_${e.data.filename}`,
				e.data.contents
			);
		} else if (e.data.type == 'progress') {
			progress = e.data.pos / e.data.len;
		} else if (e.data.type == 'done') {
			done = true;
			writer.close();
		}
	}

	async function handleFiles(e: Event) {
		const files = (<HTMLInputElement>e.target).files;
		if (files.length == 1) {
			// Set the writer instance
			writer = new Writer();
			await writer.init();
			// Extract the prefix
			prefix = getPrefix(files[0]);

			// Create a web worker and run FastFEC
			const worker = new FastFECWorker();
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
