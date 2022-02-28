import { writable } from 'svelte/store';

let animationId = 0;

// Only allow one table at a time to expand
export const tableAnimations = writable<number[]>([]);

export function getTableId() {
	const id = animationId;
	animationId++;
	return id;
}

export const animating: { [tableId: number]: boolean } = {};
