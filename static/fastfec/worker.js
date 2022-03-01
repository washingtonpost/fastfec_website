/* eslint-disable @typescript-eslint/no-empty-function */
self.onmessage = function (e) {
	runFastFEC(e.data.file);
};

async function runFastFEC(file) {
	const context = {};

	let filePosition = 0;

	function readString(location, maxBytes = null) {
		let s = '';
		let i = 0;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const c = new Uint8Array(context.wasm.instance.exports.memory['buffer'])[location];
			if (c == 0) return s;
			s += String.fromCharCode(c);
			location++;
			i++;
			if (maxBytes != null && i >= maxBytes) {
				return s;
			}
		}
	}

	let fileProgress = {};

	function write(filename, contents) {
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

	// eslint-disable-next-line no-undef
	const fileReader = new FileReaderSync();

	const env = {
		env: {
			wasmBufferRead(buffer, want) {
				const contentsBuffer = fileReader.readAsArrayBuffer(
					file.slice(filePosition, filePosition + want)
				);

				const contents = new Uint8Array(contentsBuffer);
				const received = contents.length;
				filePosition += received;

				new Uint8Array(context.wasm.instance.exports.memory['buffer']).set(contents, buffer);
				return received;
			},

			wasmBufferWrite(filename, extension, contents, numBytes) {
				self.postMessage({ pos: filePosition, len: file.size, fileProgress });
				filename = readString(filename);
				extension = readString(extension);
				filename = filename + extension;

				contents = new Uint8Array(context.wasm.instance.exports.memory['buffer']).slice(
					contents,
					contents + numBytes
				);

				// Use atomics
				write(filename, contents);
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

	async function doWasm() {
		const response = await fetch('/fastfec/libfastfec-0.0.8.wasm');
		const bytes = await response.arrayBuffer();
		const app = WebAssembly.instantiate(bytes, env);
		return app;
	}

	const wasm = await doWasm();
	context.wasm = wasm;

	// Initialize
	const BUFFER_SIZE = 6553600;
	wasm.instance.exports.wasmFec(BUFFER_SIZE);
	done();
}
