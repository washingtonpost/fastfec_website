import 'web-streams-polyfill/dist/polyfill.js';
import { assets } from '$app/paths';

export class Writer {
	public streamSaver;
	public writer;
	public closed = false;

	constructor(readonly filename: string) {}

	async init() {
		this.streamSaver = await import('streamsaver');

		if (location.protocol == 'https:') {
			// Set man-in-the-middle service worker code to a URL
			// we control (when not in dev mode since it has to be
			// served via HTTPS)
			this.streamSaver.default.mitm = `${assets}/fastfec/mitm.html`;
		}

		this.writer = this.streamSaver.createWriteStream(this.filename).getWriter();
	}

	write(contents: Uint8Array) {
		this.writer.write(contents);
	}

	close() {
		this.writer.close();
	}
}
