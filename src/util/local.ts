export function localGet<T>(key: string, fallback: T): T {
	try {
		return JSON.parse(localStorage.getItem(key));
	} catch (e) {
		return fallback;
	}
}

export function localGetBool(key: string, fallback: boolean): boolean {
	const result = localGet(key, fallback);
	if (result !== true && result !== false) {
		return fallback;
	}
	return result;
}

export function localSet<T>(key: string, value: T) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		// Safely set
	}
}
