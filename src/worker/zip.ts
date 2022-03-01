// Adapted from https://raw.githubusercontent.com/jimmywarting/StreamSaver.js/master/examples/zip-stream.js

import { Writer } from './writer';

const encoder = new TextEncoder();

interface Data {
	array: Uint8Array;
	view: DataView;
}

function getDataHelper(byteLength: number): Data {
	const uint8 = new Uint8Array(byteLength);
	return {
		array: uint8,
		view: new DataView(uint8.buffer)
	};
}

class Crc32 {
	public crc: number = -1;
	public table: number[];

	getTable(): number[] {
		let i: number;
		let j: number;
		let t: number;
		const table: number[] = [];
		for (i = 0; i < 256; i++) {
			t = i;
			for (j = 0; j < 8; j++) {
				t = t & 1 ? (t >>> 1) ^ 0xedb88320 : t >>> 1;
			}
			table[i] = t;
		}
		return table;
	}

	constructor() {
		this.crc = -1;
		this.table = this.getTable();
	}

	append(data: Uint8Array) {
		let crc = this.crc | 0;
		for (let offset = 0, len = data.length | 0; offset < len; offset++) {
			crc = (crc >>> 8) ^ this.table[(crc ^ data[offset]) & 0xff];
		}
		this.crc = crc;
	}

	get() {
		return ~this.crc;
	}
}

export class ZipObject {
	public level = 0;
	public directory = false;
	public nameBuf: Uint8Array;
	public comment: Uint8Array;
	public compressedLength = 0;
	public uncompressedLength = 0;
	public header: Data;
	public data: Data;
	public date = new Date();
	public offset: number;
	crc = new Crc32();

	constructor(readonly filename: string, readonly zipWriter: ZipWriter) {
		this.offset = zipWriter.offset;
		this.nameBuf = encoder.encode(filename);
		this.comment = encoder.encode('');
		this.header = getDataHelper(26);
		this.data = getDataHelper(30 + this.nameBuf.length);
		this.writeHeader();
	}

	writeHeader() {
		if (this.level !== 0 && !this.directory) {
			this.header.view.setUint16(4, 0x0800);
		}
		this.header.view.setUint32(0, 0x14000808);
		this.header.view.setUint16(
			6,
			(((this.date.getHours() << 6) | this.date.getMinutes()) << 5) | (this.date.getSeconds() / 2),
			true
		);
		this.header.view.setUint16(
			8,
			((((this.date.getFullYear() - 1980) << 4) | (this.date.getMonth() + 1)) << 5) |
				this.date.getDate(),
			true
		);
		this.header.view.setUint16(22, this.nameBuf.length, true);
		this.data.view.setUint32(0, 0x504b0304);
		this.data.array.set(this.header.array, 4);
		this.data.array.set(this.nameBuf, 30);
		// Write header to zip file
		this.zipWriter.write(this.data.array);
	}

	writeFooter() {
		const footer = getDataHelper(16);
		footer.view.setUint32(0, 0x504b0708);

		this.header.view.setUint32(10, this.crc.get(), true);
		this.header.view.setUint32(14, this.compressedLength, true);
		this.header.view.setUint32(18, this.uncompressedLength, true);
		footer.view.setUint32(4, this.crc.get(), true);
		footer.view.setUint32(8, this.compressedLength, true);
		footer.view.setUint32(12, this.uncompressedLength, true);

		this.zipWriter.write(footer.array);
	}

	write(content: Uint8Array) {
		this.uncompressedLength += content.length;
		this.compressedLength += content.length;
		// Write content uncompressed since it's much faster
		this.zipWriter.write(content, this);
	}
}

export class ZipWriter {
	public writer: Writer;
	public files: { [filename: string]: ZipObject } = {};
	public filenames: string[] = [];
	public offset = 0;
	public currentFilename: string | null = null;
	public currentZip: ZipObject;

	constructor(readonly filename: string) {
		this.writer = new Writer(filename);
	}

	async init() {
		await this.writer.init();
	}

	closeCurrent() {
		if (this.currentFilename != null) {
			this.files[this.currentFilename].writeFooter();
		}
		this.currentFilename = null;
	}

	createNewFile(filename: string) {
		filename = filename.replace('/', '-'); // normalize file name
		if (this.files[filename] != null) {
			throw new Error('File already exists');
		}

		this.closeCurrent();
		this.currentZip = new ZipObject(filename, this);
		this.currentFilename = filename;
		this.files[filename] = this.currentZip;
		this.filenames.push(filename);
	}

	write(data: Uint8Array, zipObject: ZipObject | null = null) {
		if (zipObject != null) {
			zipObject.crc.append(data);
		}
		this.writer.write(data);
		this.offset += data.length;
	}

	push(filename: string, content: Uint8Array) {
		if (filename != this.currentFilename) {
			this.createNewFile(filename);
		}

		this.currentZip.write(content);
	}

	closeZip() {
		let length = 0;
		let index = 0;
		let indexFilename: number;
		let file: ZipObject;
		for (indexFilename = 0; indexFilename < this.filenames.length; indexFilename++) {
			file = this.files[this.filenames[indexFilename]];
			length += 46 + file.nameBuf.length + file.comment.length;
		}
		const data = getDataHelper(length + 22);
		for (indexFilename = 0; indexFilename < this.filenames.length; indexFilename++) {
			file = this.files[this.filenames[indexFilename]];
			data.view.setUint32(index, 0x504b0102);
			data.view.setUint16(index + 4, 0x1400);
			data.array.set(file.header.array, index + 6);
			data.view.setUint16(index + 32, file.comment.length, true);
			if (file.directory) {
				data.view.setUint8(index + 38, 0x10);
			}
			data.view.setUint32(index + 42, file.offset, true);
			data.array.set(file.nameBuf, index + 46);
			data.array.set(file.comment, index + 46 + file.nameBuf.length);
			index += 46 + file.nameBuf.length + file.comment.length;
		}
		// End of central directory record
		data.view.setUint32(index, 0x504b0506);
		data.view.setUint16(index + 6, 8);
		data.view.setUint16(index + 8, this.filenames.length, true);
		data.view.setUint16(index + 10, this.filenames.length, true);
		data.view.setUint32(index + 12, length, true);
		data.view.setUint32(index + 16, this.offset, true);
		this.writer.write(data.array);
		this.writer.close();
	}

	close() {
		this.closeCurrent();
		this.closeZip();
	}
}
