import {
	randomNames,
	randomOrganizations,
	randomStates,
	randomStreetNamesByState,
	randomStreetPrefixes,
	randomStreetSuffixes,
	randomTowns,
	randomZips
} from './randomData';

const RANDOM_TRIES = 100;

function lpad(x: number) {
	const s = `${x}`;
	if (s.length == 1) return `0${s}`;
	return s;
}

class RandomContext {
	used: string[] = [];

	add(result: string) {
		this.used.push(result);
		return result;
	}

	get<T>(fn: () => T, toString: (x: T) => string = (x) => `${x}`, maxTries = RANDOM_TRIES): T {
		let i = 0;
		let guess: T;
		do {
			guess = fn();
			if (!this.used.includes(toString(guess))) {
				this.add(toString(guess));
				return guess;
			}
			i++;
		} while (i < maxTries);
		this.add(toString(guess));
		return guess;
	}

	static randomDigit(): string {
		return `${Math.floor(Math.random() * 10)}`;
	}

	static randomNumber(inclusiveLow: number, exclusiveHigh: number) {
		return Math.floor(Math.random() * (exclusiveHigh - inclusiveLow)) + inclusiveLow;
	}

	getRandomNumber(format: string): string {
		return this.get(() => {
			let result = format;
			while (result.indexOf('*') != -1) {
				const idx = result.indexOf('*');
				result = result.substring(0, idx) + RandomContext.randomDigit() + result.substring(idx + 1);
			}
			return result;
		});
	}

	getRandomAmount(): string {
		return this.choose([
			'25.00',
			'50.00',
			'100.00',
			'125.00',
			'130.00',
			'150.00',
			'200.00',
			'250.00',
			'500.00',
			'1000.00',
			'1400.00',
			'1500.00',
			'1600.00',
			'2080.00',
			'2800.00',
			'5000.00',
			'5400.00',
			'5500.00',
			'5600.00'
		]);
	}

	getRandomDate(startYear, endYear): string {
		return this.get(() => {
			const startDate = new Date(startYear, 0).getTime();
			const endDate = new Date(endYear + 1, 0).getTime();
			const date = new Date(startDate + Math.random() * (endDate - startDate));
			return `${date.getFullYear()}-${lpad(date.getMonth() + 1)}-${lpad(date.getDate())}`;
		});
	}

	getCommitteeId(): string {
		return this.getRandomNumber('C00******');
	}

	getAddress(): {
		address: string;
		city: string;
		state: string;
		zip: string;
	} {
		return this.get(
			() => {
				const state = this.choose(randomStates);
				const zip = this.getRandomNumber(randomZips[state]);
				const city = this.choose(randomTowns[state]);
				const street = this.choose(randomStreetNamesByState[state]);
				return {
					address: `${this.getRandomNumber('*****')} ${this.choose(
						randomStreetPrefixes
					)}${street} ${this.choose(randomStreetSuffixes)}`,
					city,
					state,
					zip
				};
			},
			(x) => JSON.stringify(x)
		);
	}

	getName(): [string, string] {
		// Adapted from https://raw.githubusercontent.com/appointmind/fakenames/master/names.csv
		return this.choose<[string, string]>(randomNames, (x) => `${x[0]},${x[1]}`);
	}

	choose<T>(options: T[], toString: (x: T) => string = (x) => `${x}`): T {
		return this.get(() => {
			return options[Math.floor(Math.random() * options.length)];
		}, toString);
	}

	getCommitteeName(): string {
		return this.choose(randomOrganizations);
	}
}

export abstract class RandomFECForm {
	abstract getName(): string;

	abstract getHeaders(random: RandomContext): string[];

	abstract getRowCount(random: RandomContext): number;

	abstract getRow(random: RandomContext, headers: string[]): string[];

	getRows(): string[][] {
		const context = new RandomContext();
		const headers = this.getHeaders(context);
		const rows: string[][] = [headers];
		const numRows = this.getRowCount(context);
		for (let i = 0; i < numRows; i++) {
			rows.push(this.getRow(context, headers));
		}
		return rows;
	}
}

class SA17A extends RandomFECForm {
	getName() {
		return 'SA17A.csv';
	}

	getHeaders() {
		return [
			'form_type',
			'filer_committee_id_number',
			'transaction_id',
			'back_reference_tran_id_number',
			'back_reference_sched_name',
			'entity_type',
			'contributor_organization_name',
			'contributor_last_name',
			'contributor_first_name',
			'contributor_middle_name',
			'contributor_prefix',
			'contributor_suffix',
			'contributor_street_1',
			'contributor_street_2',
			'contributor_city',
			'contributor_state',
			'contributor_zip_code',
			'election_code',
			'election_other_description',
			'contribution_date',
			'contribution_amount',
			'contribution_aggregate',
			'contribution_purpose_descrip',
			'contributor_employer',
			'contributor_occupation',
			'donor_committee_fec_id',
			'donor_committee_name',
			'donor_candidate_fec_id',
			'donor_candidate_last_name',
			'donor_candidate_first_name',
			'donor_candidate_middle_name',
			'donor_candidate_prefix',
			'donor_candidate_suffix',
			'donor_candidate_office',
			'donor_candidate_state',
			'donor_candidate_district',
			'conduit_name',
			'conduit_street1',
			'conduit_street2',
			'conduit_city',
			'conduit_state',
			'conduit_zip_code',
			'memo_code',
			'memo_text_description',
			'reference_code'
		];
	}

	getRowCount() {
		return RandomContext.randomNumber(1, 200);
	}

	getRow(random: RandomContext) {
		const [firstName, lastName] = random.getName();
		const { address, city, state, zip } = random.getAddress();

		return [
			'SA17A',
			random.getCommitteeId(),
			random.getRandomNumber('SA17A.*****'),
			'',
			'',
			'IND',
			'',
			lastName,
			firstName,
			'',
			'',
			'',
			address,
			'',
			city,
			state,
			zip,
			'G2020',
			'',
			random.getRandomDate(2020, 2020),
			random.getRandomAmount(),
			random.getRandomAmount(),
			random.getRandomNumber('EARMARKED THROUGH WINRED [SA17A.****]'),
			random.getCommitteeName(),
			'PRESIDENT',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			''
		];
	}
}

class SA17C extends RandomFECForm {
	getHeaders(): string[] {
		return [
			'form_type',
			'filer_committee_id_number',
			'transaction_id',
			'back_reference_tran_id_number',
			'back_reference_sched_name',
			'entity_type',
			'contributor_organization_name',
			'contributor_last_name',
			'contributor_first_name',
			'contributor_middle_name',
			'contributor_prefix',
			'contributor_suffix',
			'contributor_street_1',
			'contributor_street_2',
			'contributor_city',
			'contributor_state',
			'contributor_zip_code',
			'election_code',
			'election_other_description',
			'contribution_date',
			'contribution_amount',
			'contribution_aggregate',
			'contribution_purpose_descrip',
			'contributor_employer',
			'contributor_occupation',
			'donor_committee_fec_id',
			'donor_committee_name',
			'donor_candidate_fec_id',
			'donor_candidate_last_name',
			'donor_candidate_first_name',
			'donor_candidate_middle_name',
			'donor_candidate_prefix',
			'donor_candidate_suffix',
			'donor_candidate_office',
			'donor_candidate_state',
			'donor_candidate_district',
			'conduit_name',
			'conduit_street1',
			'conduit_street2',
			'conduit_city',
			'conduit_state',
			'conduit_zip_code',
			'memo_code',
			'memo_text_description',
			'reference_code'
		];
	}

	getName(): string {
		return 'SA17Cs';
	}

	getRowCount(): number {
		return RandomContext.randomNumber(1, 100);
	}

	getRow(random: RandomContext): string[] {
		const { address, state, city, zip } = random.getAddress();

		return [
			'SA17C',
			random.getCommitteeId(),
			random.getRandomNumber('SA17C.****'),
			'',
			'',
			'PAC',
			random.getCommitteeName(),
			'',
			'',
			'',
			'',
			'',
			address,
			'',
			city,
			state,
			zip,
			'G2020',
			'',
			random.getRandomDate(2021, 2021),
			random.getRandomAmount(),
			random.getRandomAmount(),
			'',
			'',
			'',
			random.getCommitteeId(),
			random.getCommitteeName(),
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			'',
			''
		];
	}
}

class F13425_header extends RandomFECForm {
	getName() {
		return 'header.csv';
	}

	getHeaders() {
		return [
			'fec_ver_#',
			'soft_name',
			'soft_ver#',
			'dec/nodec',
			'date_fmat',
			'namedelim',
			'form_name',
			'fec_idnum',
			'committee',
			'control_#',
			'SCHEDULE_COUNTS_sa11a1',
			'SCHEDULE_COUNTS_sb23'
		];
	}

	getRowCount() {
		return 1;
	}

	getRow(random: RandomContext): string[] {
		return [
			'2.02',
			'fecfile',
			'3',
			'dec',
			'ccyymmdd',
			'^',
			'f3xn',
			random.getCommitteeId(),
			random.getCommitteeName(),
			random.getRandomNumber('g******r'),
			random.getRandomNumber('000**'),
			random.getRandomNumber('000**')
		];
	}
}

function shuffle<T>(array: T[]): T[] {
	// Copied from https://stackoverflow.com/a/2450976/1404888
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

export class Randomizer {
	readonly forms = [F13425_header, SA17A, SA17C];
	public formIndex = 0;

	randomizeFormOrder() {
		shuffle(this.forms);
	}

	constructor() {
		this.randomizeFormOrder();
	}

	getRandomForm(): string[][] {
		const form = this.forms[this.formIndex % this.forms.length];
		this.formIndex++;
		return new form().getRows();
	}
}
