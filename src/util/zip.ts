// Adapted from https://raw.githubusercontent.com/jimmywarting/StreamSaver.js/master/examples/zip-stream.js

import { writeUInt64LE, writeUInt64BE } from './int53';
import { Writer } from './writer';

const encoder = new TextEncoder();

const VERSION = 0x002d;
const BIT_FLAG = 0x0808;

export interface Data {
	array: Uint8Array;
	view: DataView;
}

export function getDataHelper(byteLength: number): Data {
	const uint8 = new Uint8Array(byteLength);
	return {
		array: uint8,
		view: new DataView(uint8.buffer)
	};
}

class Crc32 {
	public crc = -1;
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
		this.data = getDataHelper(58 + this.nameBuf.length);
		this.writeHeader();
	}

	writeHeader() {
		// local file header signature     4 bytes
		this.zipWriter.writeSignature(0x04034b50);
		// version needed to extract       2 bytes
		this.zipWriter.writeUint16(VERSION); // version 4.5
		// general purpose bit flag        2 bytes
		//   - (bit 3) sizes zero in local header, in data descriptor following
		//   - (bit 11) utf-8 encoding for filenames/comments
		this.zipWriter.writeUint16(BIT_FLAG);
		// compression method              2 bytes
		this.zipWriter.writeUint16(0); // stored
		// last mod file time              2 bytes
		this.zipWriter.writeUint16(
			(((this.date.getHours() << 6) | this.date.getMinutes()) << 5) | (this.date.getSeconds() / 2)
		);
		// last mod file date              2 bytes
		this.zipWriter.writeUint16(
			((((this.date.getFullYear() - 1980) << 4) | (this.date.getMonth() + 1)) << 5) |
				this.date.getDate()
		);
		// crc-32                          4 bytes
		this.zipWriter.writeUint32(0); // saved for later
		// compressed size                 4 bytes
		this.zipWriter.writeUint32(0xffffffff); // saved for later
		// uncompressed size               4 bytes
		this.zipWriter.writeUint32(0xffffffff); // saved for later
		// file name length                2 bytes
		this.zipWriter.writeUint16(this.nameBuf.length);
		// extra field length              2 bytes
		this.zipWriter.writeUint16(32); // was 32
		// filename (variable size)
		this.zipWriter.write(this.nameBuf);

		// EXTRA FIELD for ZIP64 (32 bytes)
		// extra field header ID           2 bytes
		this.zipWriter.writeUint16(0x0001); // Zip64
		// size of extra field             2 bytes
		this.zipWriter.writeUint16(28);
		// Original uncompressed file size 8 bytes
		this.zipWriter.writeUint64(0); // saved for later
		// Size of compressed data         8 bytes
		this.zipWriter.writeUint64(0); // saved for later
		// Offset of local header record   8 bytes
		this.zipWriter.writeUint64(this.offset);
		// Disk start number               4 bytes
		this.zipWriter.writeUint32(0);
	}

	writeDataDescriptor() {
		// crc-32                          4 bytes
		this.zipWriter.writeUint32(this.crc.get());
		// compressed size                 8 bytes since ZIP64
		this.zipWriter.writeUint64(this.compressedLength);
		// uncompressed size               8 bytes since ZIP64
		this.zipWriter.writeUint32(this.uncompressedLength);
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
			this.currentZip.writeDataDescriptor();
		}
		this.currentFilename = null;
	}

	createNewFile(filename: string) {
		filename = filename.replace('/', '-'); // normalize file name
		const baseFilename = filename;
		let part = 2;
		while (this.files[filename] != null) {
			// Rename if name collision
			const dotIndex = filename.lastIndexOf('.');
			if (dotIndex == -1) {
				// No extension: just add partN
				filename = `${baseFilename}_part${part++}`;
			} else {
				// Add partN before the dot
				filename = `${baseFilename.substring(0, dotIndex)}_part${part++}${baseFilename.substring(
					dotIndex
				)}`;
			}
		}

		this.closeCurrent();
		this.currentFilename = baseFilename;
		this.currentZip = new ZipObject(filename, this);
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

	writeUint8(uint8: number) {
		const data = getDataHelper(1);
		data.view.setUint8(0, uint8);
		this.write(data.array);
	}

	writeUint16(uint16: number, littleEndian = true) {
		const data = getDataHelper(2);
		data.view.setUint16(0, uint16, littleEndian);
		this.write(data.array);
	}

	writeUint32(uint32: number, littleEndian = true) {
		const data = getDataHelper(4);
		data.view.setUint32(0, uint32, littleEndian);
		this.write(data.array);
	}

	writeSignature(uint32: number, littleEndian = true) {
		const data = getDataHelper(4);
		data.view.setUint32(0, uint32, littleEndian);
		this.write(data.array);
	}

	writeUint64(uint64: number, littleEndian = true) {
		const data = getDataHelper(8);

		if (littleEndian) {
			writeUInt64LE(uint64, data.view, 0);
		} else {
			writeUInt64BE(uint64, data.view, 0);
		}
		this.write(data.array);
	}

	push(filename: string, content: Uint8Array) {
		if (filename != this.currentFilename) {
			this.createNewFile(filename);
		}

		this.currentZip.write(content);
	}

	writeCentralDirectory(): number {
		const startOffset = this.offset;
		for (const filename of this.filenames) {
			const zipObject = this.files[filename];

			// local file header signature     4 bytes
			this.writeSignature(0x02014b50);
			// version made by                 2 bytes
			this.writeUint16(VERSION); // version 4.5
			// version needed to extract       2 bytes
			this.writeUint16(VERSION); // version 4.5
			// general purpose bit flag        2 bytes
			//   - (bit 3) sizes zero in local header, in data descriptor following
			//   - (bit 11) utf-8 encoding for filenames/comments
			this.writeUint16(BIT_FLAG);
			// compression method              2 bytes
			this.writeUint16(0); // stored
			// last mod file time              2 bytes
			this.writeUint16(
				(((zipObject.date.getHours() << 6) | zipObject.date.getMinutes()) << 5) |
					(zipObject.date.getSeconds() / 2)
			);
			// last mod file date              2 bytes
			this.writeUint16(
				((((zipObject.date.getFullYear() - 1980) << 4) | (zipObject.date.getMonth() + 1)) << 5) |
					zipObject.date.getDate()
			);
			// crc-32                          4 bytes
			this.writeUint32(zipObject.crc.get());
			// compressed size                 4 bytes
			this.writeUint32(0xffffffff); // saved for later
			// uncompressed size               4 bytes
			this.writeUint32(0xffffffff); // saved for later
			// file name length                2 bytes
			this.writeUint16(zipObject.nameBuf.length);
			// extra field length              2 bytes
			this.writeUint16(32);
			// file comment length             2 bytes
			this.writeUint16(0);
			// disk number start               2 bytes
			this.writeUint16(0xffff);
			// internal file attributes        2 bytes
			this.writeUint16(0);
			// external file attributes        4 bytes
			this.writeUint32(0);
			// relative offset of local header 4 bytes
			this.writeUint32(0xffffffff); // saved for later
			// filename (variable size)
			this.write(zipObject.nameBuf);

			// EXTRA FIELD for ZIP64 (32 bytes)
			// extra field header ID           2 bytes
			this.writeUint16(0x0001); // Zip64
			// size of extra field             2 bytes
			this.writeUint16(28);
			// Original uncompressed file size 8 bytes
			this.writeUint64(zipObject.uncompressedLength);
			// Size of compressed data         8 bytes
			this.writeUint64(zipObject.compressedLength);
			// Offset of local header record   8 bytes
			this.writeUint64(zipObject.offset);
			// Disk start number               4 bytes
			this.writeUint32(0);
		}
		return this.offset - startOffset;
	}

	writeZip64EndOfCentralDirectoryRecord(
		centralDirectoryOffset: number,
		centralDirectorySize: number
	) {
		const zip64EndOfCentralDirectorySize = 44;

		// zip64 end of central dir
		// signature                       4 bytes  (0x06064b50)
		this.writeSignature(0x06064b50);
		// size of zip64 end of central
		// directory record                8 bytes
		this.writeUint64(zip64EndOfCentralDirectorySize);
		// version made by                 2 bytes
		this.writeUint16(VERSION); // version 4.5
		// version needed to extract       2 bytes
		this.writeUint16(VERSION); // version 4.5
		// number of this disk             4 bytes
		this.writeUint32(0);
		// number of the disk with the
		// start of the central directory  4 bytes
		this.writeUint32(0);
		// total number of entries in the
		// central directory on this disk  8 bytes
		this.writeUint64(this.filenames.length);
		// total number of entries in the
		// central directory               8 bytes
		this.writeUint64(this.filenames.length);
		// size of the central directory   8 bytes
		this.writeUint64(centralDirectorySize);
		// offset of start of central
		// directory with respect to
		// the starting disk number        8 bytes
		this.writeUint64(centralDirectoryOffset);
	}

	writeZip64EndOfCentralDirectoryLocator(zip64EndOfCentralDirectoryOffset: number) {
		// zip64 end of central dir locator
		// signature                       4 bytes  (0x07064b50)
		this.writeSignature(0x07064b50);
		// number of the disk with the
		// start of the zip64 end of
		// central directory               4 bytes
		this.writeUint32(0);
		// relative offset of the zip64
		// end of central directory record 8 bytes
		this.writeUint64(zip64EndOfCentralDirectoryOffset);
		// total number of disks           4 bytes
		this.writeUint32(1);
	}

	writeEndOfCentralDirectoryRecord() {
		// end of central dir signature    4 bytes  (0x06054b50)
		this.writeSignature(0x06054b50);
		// number of this disk             2 bytes
		this.writeUint16(0xffff);
		// number of the disk with the
		// start of the central directory  2 bytes
		this.writeUint16(0xffff);
		// total number of entries in the
		// central directory on this disk  2 bytes
		this.writeUint16(0xffff);
		// total number of entries in
		// the central directory           2 bytes
		this.writeUint16(0xffff);
		// size of the central directory   4 bytes
		// offset of start of central
		// directory with respect to
		this.writeUint32(0xffffffff);
		// the starting disk number        4 bytes
		this.writeUint32(0xffffffff);
		// .ZIP file comment length        2 bytes
		this.writeUint16(0);
	}

	closeZip() {
		const centralDirectoryOffset = this.offset;
		const centralDirectorySize = this.writeCentralDirectory();
		const zip64EndOfCentralDirectoryOffset = this.offset;
		this.writeZip64EndOfCentralDirectoryRecord(centralDirectoryOffset, centralDirectorySize);
		this.writeZip64EndOfCentralDirectoryLocator(zip64EndOfCentralDirectoryOffset);
		this.writeEndOfCentralDirectoryRecord();

		this.writer.close();
	}

	close() {
		this.closeCurrent();
		this.closeZip();
	}
}
