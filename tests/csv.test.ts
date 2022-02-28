import { CSVError, CSVReader } from '../src/util/csv';

function csvTest(csvText: string, expectedRows: string[][], normalizeWhitespace = true) {
	const csv = normalizeWhitespace
		? csvText
				.split('\n')
				.filter((x: string) => x.trim().length > 0)
				.map((x: string) => x.trim())
				.join('\n') + '\n'
		: csvText;
	const csvReader = new CSVReader();
	const encoder = new TextEncoder(); // defaults to utf-8
	const data = encoder.encode(csv);
	csvReader.processData(data);
	expect(csvReader.rows).toEqual(expectedRows);
}

test('csv reader', () => {
	csvTest(
		`
      header1,header2,header3
      row1,row2,row3
    `,
		[
			['header1', 'header2', 'header3'],
			['row1', 'row2', 'row3']
		]
	);

	csvTest(
		`
      "dog","cat","park"
    `,
		[['dog', 'cat', 'park']]
	);

	csvTest(
		`
      """hello""","middle""quote","""",""
    `,
		[[`"hello"`, `middle"quote`, `"`, '']]
	);

	csvTest(
		`
      ,,"a,b",",",,
    `,
		[['', '', 'a,b', ',', '', '']]
	);

	expect(() =>
		csvTest(
			`
      "abc"def",<-this should error
    `,
			[]
		)
	).toThrowError(CSVError);

	csvTest(
		`form_type,filer_committee_id_number,committee_name,street_1,street_2,city,state,zip_code,treasurer_last_name,treasurer_first_name,treasurer_middle_name,treasurer_prefix,treasurer_suffix,date_signed,text_code,text
F99,C00714964,Dr. Cameron Webb for Congress,PO Box 679,,Charlottesville,VA,22902,Cullop,Ben,,,,2021-02-16,MST,"February 16, 2021
Mr. Michael Dobi
Senior Campaign Finance & Reviewing Analyst
Federal Election Commission
Washington, DC  20463

Re:	Dr. Cameron Webb for Congress (C00714964)

Dear Mr. Dobi:
This is in response to your letter dated January 10, 2021 regarding the post-general report for Dr. Cameron Webb for Congress (""the Committee"").

You asked about contributions that exceed the limits. Many of these have been redesignated to spouses, which appeared on the year-end report filed January 31st. The remaining contributions will be refunded.

You also asked about contributions that were designated to the Primary but received after the date of the Primary election. These designations were due to a clerical error and an amendment has been filed to correctly designate them to the General Election.

You also asked about contributions that were missing during the 48 hour reporting period. Amendments have been filed to correctly reflect the dates these contributions were received. 

Finally, you asked about the joint fundraising committee Congressional Black Caucus PAC. This transfer was inadvertently reported from the wrong committee, it was from the CBCPAC-New Dem Fund for the Majority and the Statement or Organization has been amended to include this committee as an authorized representative. 

We hope this adequately answers your questions. If you have any additional questions, please contact the Committee.

Dr. Cameron Webb for Congress

"
`,
		[
			[
				'form_type',
				'filer_committee_id_number',
				'committee_name',
				'street_1',
				'street_2',
				'city',
				'state',
				'zip_code',
				'treasurer_last_name',
				'treasurer_first_name',
				'treasurer_middle_name',
				'treasurer_prefix',
				'treasurer_suffix',
				'date_signed',
				'text_code',
				'text'
			],
			[
				'F99',
				'C00714964',
				'Dr. Cameron Webb for Congress',
				'PO Box 679',
				'',
				'Charlottesville',
				'VA',
				'22902',
				'Cullop',
				'Ben',
				'',
				'',
				'',
				'2021-02-16',
				'MST',
				`February 16, 2021
Mr. Michael Dobi
Senior Campaign Finance & Reviewing Analyst
Federal Election Commission
Washington, DC  20463

Re:	Dr. Cameron Webb for Congress (C00714964)

Dear Mr. Dobi:
This is in response to your letter dated January 10, 2021 regarding the post-general report for Dr. Cameron Webb for Congress ("the Committee").

You asked about contributions that exceed the limits. Many of these have been redesignated to spouses, which appeared on the year-end report filed January 31st. The remaining contributions will be refunded.

You also asked about contributions that were designated to the Primary but received after the date of the Primary election. These designations were due to a clerical error and an amendment has been filed to correctly designate them to the General Election.

You also asked about contributions that were missing during the 48 hour reporting period. Amendments have been filed to correctly reflect the dates these contributions were received. 

Finally, you asked about the joint fundraising committee Congressional Black Caucus PAC. This transfer was inadvertently reported from the wrong committee, it was from the CBCPAC-New Dem Fund for the Majority and the Statement or Organization has been amended to include this committee as an authorized representative. 

We hope this adequately answers your questions. If you have any additional questions, please contact the Committee.

Dr. Cameron Webb for Congress

`
			]
		],
		false
	);
});
