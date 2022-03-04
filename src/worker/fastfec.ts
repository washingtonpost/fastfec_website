/* eslint-disable  @typescript-eslint/no-empty-function */

self.onmessage = function (e: { data: { file: File; assets: string } }) {
	runFastFEC(e.data.file, e.data.assets);
};

interface Context {
	wasm?: {
		instance: {
			exports: {
				memory: {
					buffer: Buffer;
				};
				wasmFec: (number) => void;
			};
		};
	};
}

async function runFastFEC(file: File, assets: string) {
	const context: Context = {};

	let filePosition = 0;

	function readString(location: number, maxBytes: number | null = null) {
		let s = '';
		let i = 0;
		while (true) {
			const c = new Uint8Array(context.wasm.instance.exports.memory.buffer)[location];
			if (c == 0) return s;
			s += String.fromCharCode(c);
			location++;
			i++;
			if (maxBytes != null && i >= maxBytes) {
				return s;
			}
		}
	}

	const fileProgress: { [key: string]: number } = {};

	function write(filename: string, contents: Uint8Array) {
		self.postMessage({
			type: 'write',
			filename,
			contents
		});
		fileProgress[filename] = (fileProgress[filename] || 0) + contents.length;
		self.postMessage({ type: 'progress', pos: filePosition, len: file.size, fileProgress });
	}

	function done() {
		self.postMessage({
			type: 'done'
		});
	}

	const fileReader = new FileReaderSync();

	const env = {
		env: {
			wasmBufferRead(buffer: number, want: number) {
				const contentsBuffer = fileReader.readAsArrayBuffer(
					file.slice(filePosition, filePosition + want)
				);

				const contents = new Uint8Array(contentsBuffer);
				const received = contents.length;
				filePosition += received;

				new Uint8Array(context.wasm.instance.exports.memory.buffer).set(contents, buffer);
				return received;
			},

			wasmBufferWrite(filename: number, extension: number, contents: number, numBytes: number) {
				self.postMessage({ pos: filePosition, len: file.size, fileProgress });
				let filenameString = readString(filename);
				const extensionString = readString(extension);
				filenameString = filenameString + extensionString;

				const contentsArray = new Uint8Array(context.wasm.instance.exports.memory['buffer']).slice(
					contents,
					contents + numBytes
				);

				write(filenameString, contentsArray);
			},

			main() {}
		},
		wasi_snapshot_preview1: {
			args_get() {},
			args_sizes_get() {},
			clock_res_get() {},
			clock_time_get() {},
			environ_get() {},
			environ_sizes_get() {},
			fd_advise() {},
			fd_allocate() {},
			fd_close() {},
			fd_datasync() {},
			fd_fdstat_get() {},
			fd_fdstat_set_flags() {},
			fd_fdstat_set_rights() {},
			fd_filestat_get() {},
			fd_filestat_set_size() {},
			fd_filestat_set_times() {},
			fd_pread() {},
			fd_prestat_dir_name() {},
			fd_prestat_get() {},
			fd_pwrite() {},
			fd_read() {},
			fd_readdir() {},
			fd_renumber() {},
			fd_seek() {},
			fd_sync() {},
			fd_tell() {},
			fd_write() {},
			path_create_directory() {},
			path_filestat_get() {},
			path_filestat_set_times() {},
			path_link() {},
			path_open() {},
			path_readlink() {},
			path_remove_directory() {},
			path_rename() {},
			path_symlink() {},
			path_unlink_file() {},
			poll_oneoff() {},
			proc_exit() {},
			proc_raise() {},
			random_get() {},
			sched_yield() {},
			sock_recv() {},
			sock_send() {},
			sock_shutdown() {}
		}
	};

	async function doWasm(assets: string): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
		const response = await fetch(`${assets}/fastfec/libfastfec-0.0.8-1.wasm`);
		const bytes = await response.arrayBuffer();
		const app = WebAssembly.instantiate(bytes, env);
		return app;
	}

	const wasm = await doWasm(assets);
	context.wasm = wasm as unknown as Context['wasm'];

	// Initialize
	const BUFFER_SIZE = 6553600;
	context.wasm.instance.exports.wasmFec(BUFFER_SIZE);
	done();
}

export {};
