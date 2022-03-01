<script lang="ts">
	import { onMount } from 'svelte';
	import { animating, getTableId, tableAnimations } from './tablelock';
	import { cubicInOut } from 'svelte/easing';

	export let rows: string[][];
	export let done = false;

	export const ROWS_TO_SHOW = 10;

	$: showRows = rows.slice(0, ROWS_TO_SHOW);

	let asCsv = true;
	let csvElem: HTMLDivElement;
	let tableElem: HTMLTableElement;
	let createdElements: HTMLElement[] = [];

	const INITIAL_DELAY = 500;
	const ROW_DELAY = 50;
	const COMMA_FADE = 300;
	const FIELD_MOVE = 600;

	interface Transition {
		delay: number;
		duration: number;
		elements: HTMLElement[];
		style: string;
		start: number;
		end: number;
		toString: (number: number) => string;
	}

	async function transition(
		easing: (t: number) => number,
		transitions: Transition[],
		overallDuration = 0
	): Promise<void> {
		return new Promise((resolve) => {
			let startTime: number | null = null;

			if (transitions.length > 0) {
				overallDuration = 0;
				for (const transition of transitions) {
					const duration = transition.delay + transition.duration;
					if (duration > overallDuration) {
						overallDuration = duration;
					}
				}
			}

			function _transition(highResTimestamp: DOMHighResTimeStamp | null = null) {
				if (highResTimestamp == null) {
					requestAnimationFrame(_transition);
					return;
				}
				if (startTime == null) {
					startTime = highResTimestamp;
				}

				const delta = highResTimestamp - startTime;

				for (const transition of transitions) {
					const t = Math.min(
						Math.max(easing((delta - transition.delay) / transition.duration), 0),
						1
					);
					const value = transition.start + (transition.end - transition.start) * t;

					for (const element of transition.elements) {
						element.style[transition.style] = transition.toString(value);
					}
				}

				if (delta < overallDuration) {
					requestAnimationFrame(_transition);
				} else {
					resolve();
				}
			}
			_transition();
		});
	}

	function px(x: number): string {
		return `${x}px`;
	}

	const EASING = cubicInOut;

	async function animate(tableId: number) {
		if (animating[tableId] != null) return;
		animating[tableId] = true;
		const startFields: HTMLSpanElement[] = Array.from(csvElem.querySelectorAll('.field'));
		const endFields: HTMLTableCellElement[] = Array.from(tableElem.querySelectorAll('.field'));
		if (startFields.length != endFields.length) {
			console.error(`Incompatible lengths (${startFields.length} vs ${endFields.length})`);
			// Jump straight to table
			asCsv = false;
			return;
		}

		const absoluteFields: Node[] = [];

		const separators: HTMLSpanElement[] = Array.from(csvElem.querySelectorAll('.separator'));

		const transitions: Transition[] = [];
		for (let i = 0; i < startFields.length; i++) {
			const startField = startFields[i];
			const endField = endFields[i];
			// Clone the field
			// (have to coerce type definition: https://github.com/microsoft/TypeScript/issues/283)
			const absoluteField: HTMLSpanElement = startField.cloneNode(
				true
			) as unknown as HTMLSpanElement;

			// Make it absolute
			absoluteField.style.position = 'absolute';

			const startBoundingRect = startField.getBoundingClientRect();
			absoluteField.style.left = `${startField.offsetLeft}px`;
			absoluteField.style.top = `${startField.offsetTop}px`;
			absoluteField.style.width = `${startBoundingRect.width}px`;
			startField.style.visibility = 'hidden';

			// Move to table position
			const endBoundingRect = endField.getBoundingClientRect();
			transitions.push(
				{
					elements: [absoluteField],
					delay: (i / startFields.length) * showRows.length * ROW_DELAY,
					duration: FIELD_MOVE,
					style: 'left',
					start: startField.offsetLeft,
					end: endField.offsetLeft,
					toString: px
				},
				{
					elements: [absoluteField],
					delay: (i / startFields.length) * showRows.length * ROW_DELAY,
					duration: FIELD_MOVE,
					style: 'top',
					start: startField.offsetTop,
					end: endField.offsetTop,
					toString: px
				},
				{
					elements: [absoluteField],
					delay: (i / startFields.length) * showRows.length * ROW_DELAY,
					duration: FIELD_MOVE,
					style: 'width',
					start: startBoundingRect.width,
					end: endBoundingRect.width - 20,
					toString: px
				}
			);

			csvElem.prepend(absoluteField);
			createdElements.push(absoluteField);
			absoluteFields.push(absoluteField);
		}
		// Run all the transitions
		await transition(EASING, [], INITIAL_DELAY);
		await transition(EASING, [
			{
				elements: separators,
				delay: 0,
				duration: COMMA_FADE,
				style: 'color',
				start: 0,
				end: 255,
				toString: (x) => `rgba(${x},${x},${x}, 1)`
			},
			{
				elements: separators,
				delay: 0,
				duration: COMMA_FADE,
				style: 'background',
				start: 0,
				end: 1,
				toString: (x) => `rgba(0, 0, 0, ${x})`
			}
		]);
		await transition(EASING, [
			{
				elements: separators,
				delay: 0,
				duration: COMMA_FADE,
				style: 'opacity',
				start: 1,
				end: 0,
				toString: (x) => `${x}`
			}
		]);
		await transition(EASING, transitions);

		// Swap the table
		asCsv = false;

		// Remove the current table id
		tableAnimations.update(($tables) => $tables.filter((id) => id != tableId));
	}

	onMount(() => {
		const tableId = getTableId();
		const unsubscribe = tableAnimations.subscribe(($table) => {
			if ($table.length > 0 && $table[0] == tableId) {
				animate(tableId);
			}
		});
		tableAnimations.update(($tables) => {
			if ($tables.includes(tableId)) return $tables;
			return [...$tables, tableId];
		});
		return () => {
			// Remove the current table id
			tableAnimations.update(($tables) => $tables.filter((id) => id != tableId));

			// Remove created elements
			for (const createdElement of createdElements) {
				createdElement.remove();
			}
			createdElements = [];

			unsubscribe();
		};
	});
</script>

<div class="container">
	<div class="message">
		Showing {showRows.length == rows.length ? 'all ' : ''}{showRows.length} row{showRows.length == 1
			? ''
			: 's'}{showRows.length == rows.length
			? ''
			: ` out of ${rows.length}${rows.length == 100 ? '+' : ''}`}
		{#if done}<button>Download all (.zip)</button>{/if}
	</div>
	{#if asCsv}
		<div bind:this={csvElem} class="csv">
			{#each showRows as row, i}
				<div>
					{#each row as field, j}
						{#if i == 0}<span class="field"><b>{field}</b></span>{#if j != row.length - 1}<span
									class="separator"><b>,</b></span
								>{/if}{:else}<span class="field">{field}</span>{#if j != row.length - 1}<span
									class="separator">,</span
								>{/if}
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{/if}
	<table bind:this={tableElem} style:visibility={asCsv ? 'hidden' : 'visible'}>
		{#each showRows as row, i}
			<tr>
				{#each row as field}
					{#if i == 0}
						<th class="field">{field}</th>
					{:else}
						<td class="field">{field}</td>
					{/if}
				{/each}
			</tr>
		{/each}
	</table>
</div>

<style>
	.container {
		position: relative;
	}

	.csv {
		position: absolute;
		white-space: nowrap;
	}

	table {
		border-collapse: collapse;
	}

	span {
		display: inline-block;
	}

	span,
	td,
	th {
		font-family: monospace;
		font-size: 12px;
		-webkit-text-size-adjust: none;
	}

	td,
	th {
		vertical-align: top;
		padding: 0;
		padding-right: 20px;
		padding-bottom: 10px;
		text-align: left;
	}

	.message {
		color: gray;
		font-size: 12px;
		margin: 0 0 9px 0;
	}

	button {
		background: rgb(233, 233, 233);
		color: #35639b;
		border-radius: 10px;
		padding: 2px 8px;
		border: none;
		font-size: 12px;
		margin: 0 5px;
	}
</style>
