<script lang="ts">
	import { CSVReader } from '../util/csv';

	import FECTable from './fectable.svelte';
	import Tabs from './tabs.svelte';
	import Progress from './progress.svelte';
	import FastFECWorker from '../worker/fastfec?worker';
	import { ZipWriter } from '../util/zip';
	import { humanFileSize } from '../util/fileSize';
	import { createEventDispatcher } from 'svelte';
	import { assets } from '$app/paths';

	const dispatch = createEventDispatcher();

	export let expanded = false;
	export let autoDownload = true;
	export let shouldAnimate = true;
	let startTime: number | null = null;
	let endTime: number | null = null;
	let currentTime = Date.now();

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

	let csvs: { [filename: string]: CSVReader } = {};

	let progress = 0;
	let totalSize = 0;
	let csvProgress: { [filename: string]: number } = {};
	let done = false;

	const CUTOFF_ROWS = 100;

	let writer: ZipWriter;

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

	function round(rowCount: number, fuzzyFactor = 1000) {
		if (rowCount < CUTOFF_ROWS) return Math.round(rowCount).toLocaleString();
		return (Math.round(rowCount / fuzzyFactor) * fuzzyFactor).toLocaleString();
	}

	function formatTime(seconds: number) {
		if (seconds < 0) seconds = 0;
		const minutes = Math.floor(seconds / 60);
		seconds = Math.floor(seconds - minutes * 60);
		if (seconds < 10) {
			return `${minutes}:0${seconds}`;
		}
		return `${minutes}:${seconds}`;
	}

	function getRowCount(
		csvs: { [filename: string]: CSVReader },
		csvProgress: { [filename: string]: number }
	) {
		let totalRows = 0;
		for (const key of Object.keys(csvs)) {
			totalRows += csvs[key].estimatedRows(csvProgress[key]);
		}
		return totalRows;
	}

	function handleMessage(e: { data: Message }) {
		if (e.data.type == 'write') {
			const filename = e.data.filename;
			if (csvs[filename] == null) {
				csvs[filename] = new CSVReader(CUTOFF_ROWS);
			}
			totalSize += e.data.contents.length;
			csvProgress = {
				...csvProgress,
				filename: (csvProgress[filename] || 0) + e.data.contents.length
			};
			csvs[filename].processData(e.data.contents);
			// Download the file
			if (writer != null && autoDownload) {
				writer.push(e.data.filename, e.data.contents);
			}
		} else if (e.data.type == 'progress') {
			progress = e.data.pos / e.data.len;
			csvProgress = e.data.fileProgress;
			currentTime = Date.now();
		} else if (e.data.type == 'done') {
			done = true;
			endTime = Date.now();
			if (writer != null && autoDownload) {
				writer.close();
			}
		}
	}

	async function handleFiles(e: Event) {
		const files = (<HTMLInputElement>e.target).files;
		if (files.length == 1) {
			csvs = {};
			progress = 0;
			done = false;

			// Extract the prefix
			const prefix = getPrefix(files[0]);

			startTime = Date.now();
			endTime = null;

			// Set the writer instance
			if (autoDownload) {
				writer = new ZipWriter(prefix == null ? 'archive.zip' : `${prefix}.zip`);
				await writer.init();

				window.onunload = () => {
					// Abort the download
					if (!done) {
						writer.writer.writer.abort();
					}
				};

				window.onbeforeunload = (evt) => {
					if (!done) {
						evt.returnValue = `Still processing / downloading. Are you sure you want to leave?`;
					}
				};
			}

			// Create a web worker and run FastFEC
			const worker = new FastFECWorker();
			worker.addEventListener('message', handleMessage);
			worker.postMessage({ file: files[0], assets });

			dispatch('processing');
		}
	}
</script>

<input disabled={startTime != null} on:input={handleFiles} accept=".fec" type="file" />
{#if startTime != null}<button on:click={() => location.reload()}>reset</button>{/if}

{#if startTime != null}
	<div class="stats">
		<div>
			{#if done}
				Done in {formatTime(((endTime || currentTime) - startTime) / 1000)}
			{:else}
				{formatTime(((endTime || currentTime) - startTime) / 1000)} / {formatTime(
					((1 / progress) * ((endTime || currentTime) - startTime)) / 1000
				)} ({(progress * 100).toFixed(0)}%)
			{/if}
		</div>
		<div>
			Total output size: {humanFileSize(totalSize)} (~{round(getRowCount(csvs, csvProgress))} rows)
		</div>
	</div>
{/if}

<Tabs
	dict={csvs}
	component={FECTable}
	accessor={(x) => ({ rows: x.rows })}
	extraProps={{ done, expanded, cutoffRows: CUTOFF_ROWS, shouldAnimate }}
>
	<div slot="tabname" let:key>
		{#if expanded}
			<div class="tabkey">
				{key}
			</div>
			<div>
				{humanFileSize(csvProgress[key])}
			</div>
			<div>
				{csvs[key].rows.length >= CUTOFF_ROWS ? '~' : ''}{round(
					csvs[key].estimatedRows(csvProgress[key])
				)} rows
			</div>
		{:else}
			{key}
		{/if}
	</div>
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

	.tabkey {
		margin-bottom: 3px;
		font-weight: bold;
		font-size: 16px;
	}

	.stats {
		font-size: 14px;
		margin: 1em 0;
		color: gray;
	}
</style>
