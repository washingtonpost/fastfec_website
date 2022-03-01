import 'web-streams-polyfill/dist/polyfill.js';

export class Writer {
	public streamSaver;
	public writers = {};
	public lastFilename = null;
	public closed: { [filename: string]: boolean } = {};

	async init() {
		this.streamSaver = await import('streamsaver');

		if (location.protocol == 'https:') {
			// Set man-in-the-middle service worker code to a URL
			// we control (when not in dev mode since it has to be
			// served via HTTPS)
			this.streamSaver.default.mitm = '/fastfec/mitm.html';
		}
	}

	closeFilename(filename: string) {
		if (filename == null) return;
		if (this.closed[filename]) {
			// Already closed
			return;
		}
		this.closed[filename] = true;
		this.writers[filename].close();
	}

	writeFile(filename: string, contents: Uint8Array) {
		if (filename != this.lastFilename) {
			this.closeFilename(this.lastFilename);
			this.lastFilename = filename;
		}

		let writer = this.writers[filename];
		if (writer == null) {
			writer = this.streamSaver.createWriteStream(filename).getWriter();
			this.writers[filename] = writer;
		}

		writer.write(contents);
	}

	close() {
		for (const filename of Object.keys(this.writers)) {
			this.closeFilename(filename);
		}
	}
}
