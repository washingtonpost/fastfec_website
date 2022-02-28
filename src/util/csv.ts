export class CSVError extends Error {}

/**
 * Reads in a CSV file from a Uint8Array, character-by-character, forming
 * complete rows as possible. Once a certain number of cut-off rows is
 * reached, stops reading in rows
 */
export class CSVReader {
	public rows: string[][] = [];
	public currentRow: string[] = [];
	public currentField = '';
	public escaped = false;
	public startOfField = true;
	public startOfLine = true;
	public checkEscape = false;

	constructor(readonly cutoffRows: number | null = null) {}

	resetField() {
		this.currentField = '';
		this.escaped = false;
		this.startOfField = true;
	}

	pushField() {
		this.currentRow.push(this.currentField);
		this.resetField();
	}

	resetLine() {
		this.resetField();
		this.currentRow = [];
		this.startOfLine = true;
	}

	pushLine() {
		if (this.currentRow.length == 0) {
			// Empty line
			this.resetLine();
		} else {
			this.pushField();
			this.rows.push(this.currentRow);
			this.resetLine();
		}
	}

	readChar(c: string) {
		// Read a single character and process it
		if (this.startOfField) {
			if (c == ',') {
				// Empty field
				this.pushField();
				return;
			} else if (c == '\n') {
				// Empty field
				this.pushLine();
				return;
			}
			this.escaped = c == '"';
			this.startOfField = false;
			if (this.escaped) {
				return;
			}
		}

		if (this.checkEscape) {
			this.checkEscape = false;
			if (c != '"') {
				// The previous character was the end of the field
				if (c == ',') {
					// On to the next field
					this.pushField();
				} else if (c == '\n') {
					// On to the next line
					this.pushLine();
				} else {
					throw new CSVError(`Unexpected character following quote: ${c}`);
				}
				return;
			} else {
				// A double quote
				this.currentField += '"';
				return;
			}
		}

		if (c == '\0') {
			// End of line
			this.pushLine();
		}
		if (!this.escaped && (c == ',' || c == '\n')) {
			// If not in escaped mode and end of field is encountered
			// then we're done with the current field
			if (c == ',') {
				this.pushField();
			} else if (c == '\n') {
				this.pushLine();
			}
			return;
		}

		if (this.escaped && c == '"') {
			if (!this.checkEscape) {
				// If in escaped mode and a quote is encountered, then we
				// need to check if the quote is escaped
				this.checkEscape = true;
				return;
			}
		}

		// Otherwise, a seemingly normal character
		this.currentField += c;
	}

	processData(data: Uint8Array) {
		if (this.cutoffRows != null && this.rows.length >= this.cutoffRows) {
			return;
		}
		for (let i = 0; i < data.length; i++) {
			if (this.cutoffRows != null && this.rows.length >= this.cutoffRows) {
				return;
			}
			this.readChar(String.fromCharCode(data[i]));
		}
	}
}
