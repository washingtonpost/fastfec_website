// Adapted from https://github.com/dannycoates/int53/blob/master/index.js
const MAX_UINT32 = 0x00000000ffffffff;
const MAX_INT53 = 0x001fffffffffffff;

function assert(test: boolean, message: string) {
	if (!test) throw new Error(message);
}

export function uintHighLow(number: number): [number, number] {
	assert(number > -1 && number <= MAX_INT53, 'number out of range');
	assert(Math.floor(number) === number, 'number must be an integer');
	let high = 0;
	const signbit = number & 0xffffffff;
	const low = signbit < 0 ? (number & 0x7fffffff) + 0x80000000 : signbit;
	if (number > MAX_UINT32) {
		high = (number - low) / (MAX_UINT32 + 1);
	}
	return [high, low];
}

export function writeUInt64LE(number: number, buffer: DataView, offset = 0) {
	const hl = uintHighLow(number);
	buffer.setUint32(offset, hl[1], true);
	buffer.setUint32(offset + 4, hl[0], true);
}

export function writeUInt64BE(number: number, buffer: DataView, offset = 0) {
	const hl = uintHighLow(number);
	buffer.setUint32(offset + 4, hl[0], false);
	buffer.setUint32(offset, hl[1], false);
}
