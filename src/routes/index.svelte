<script lang="ts">
	import { onMount } from 'svelte';

	import Demo from '../components/demo.svelte';
	import { assets } from '$app/paths';

	let os = 'linux';

	onMount(() => {
		// Get OS
		// adapted from https://stackoverflow.com/a/41845159/1404888
		if (navigator.userAgent.indexOf('Win') != -1) os = 'windows';
		if (navigator.userAgent.indexOf('Mac') != -1) os = 'mac';
	});
</script>

<p>FastFEC is a command-line tool and library for parsing .fec files quickly written in C.</p>

<Demo />

<!-- <h2>Demo</h2>

<p>
	Upload a .fec file to parse it and download a zip of .csv files entirely in-browser using
	WebAssembly.
</p>

<p><a href={`${assets}/demo`}>View demo ≫</a></p> -->

<h2>Installation</h2>

View instructions:
<select bind:value={os}>
	<option value="linux">Linux</option>
	<option value="mac">Mac OS X</option>
	<option value="windows">Windows</option>
</select>

{#if os == 'mac'}
	<p>Options:</p>
	<ul>
		<li>
			If you have <a href="https://brew.sh/" target="_blank">Homebrew</a> installed:
			<pre>brew install fastfec</pre>
		</li>
		<li>
			Download the appropriate release:
			<ul>
				<li>
					Apple Intel: <a
						href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-macos-x86_64-0.2.0.zip"
						>fastfec-macos-x86_64-0.2.0.zip</a
					> (263 KB)
				</li>
				<li>
					Apple Silicon: <a
						href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-macos-aarch64-0.2.0.zip"
						>fastfec-macos-aarch64-0.2.0.zip</a
					> (348 KB)
				</li>
			</ul>
		</li>
	</ul>
{:else if os == 'windows'}
	Download the appropriate release:
	<ul>
		<li>
			Windows x86 (most systems): <a
				href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-windows-x86_64-0.2.0.zip"
				>fastfec-windows-x86_64-0.2.0.zip</a
			> (276 KB)
		</li>
		<li>
			Windows ARM: <a
				href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-windows-aarch64-0.2.0.zip"
				>fastfec-windows-aarch64-0.2.0.zip</a
			> (348 KB)
		</li>
	</ul>
{:else}
	<p>Options:</p>
	<ul>
		<li>
			If you have <a href="https://brew.sh/" target="_blank">Homebrew</a> installed:
			<pre>brew install fastfec</pre>
		</li>
		<ul>
			Download the appropriate release:
			<li>
				Linux x86 (most systems): <a
					href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-linux-gnu-x86_64-0.2.0.zip"
					>fastfec-linux-gnu-x86_64-0.2.0.zip</a
				> (291 KB)
			</li>
			<li>
				Linux ARM: <a
					href="https://github.com/washingtonpost/FastFEC/releases/download/0.2.0/fastfec-linux-gnu-aarch64-0.2.0.zip"
					>fastfec-linux-gnu-aarch64-0.2.0.zip</a
				> (378 KB)
			</li>
		</ul>
	</ul>
{/if}

<h2>Python library</h2>

<p>
	FastFEC is available as an installable <a href="https://pypi.org/project/fastfec/" target="_blank"
		>Python library</a
	>.
	<code>pip install fastfec</code>
	to get started. Learn more
	<a href="https://github.com/washingtonpost/FastFEC/tree/develop/python" target="_blank">here</a>.
</p>

<h2>Command-line usage</h2>
<p>
	Once FastFEC has been installed and is in your path, you can run the program by calling <code
		>fastfec</code
	> in your terminal:
</p>
<pre><code
		>Usage: fastfec [flags] &lt;id, file&gt; [output directory=output] [override id]
or: [some command] | fastfec [flags] &lt;id&gt; [output directory=output]
	</code></pre>
<ul>
	<li><code>[flags]</code>: optional flags which must come before other args; see below</li>
	<li>
		<code>&lt;id, file&gt;</code> is either
		<ul>
			<li>a numeric ID, in which case the filing is streamed from the FEC website</li>
			<li>a file, in which case the filing is read from disk at the specified local path</li>
		</ul>
	</li>
	<li>
		<code>[output directory]</code> is the folder in which CSV files will be written. By default, it
		is <code>output/</code>.
	</li>
	<li>
		<code>[override id]</code> is an ID to use as the filing ID. If not specified, this ID is pulled
		out of the first parameter as a numeric component that can be found at the end of the path.
	</li>
</ul>
<p>
	The CLI will read the specified filing from disk and then write output CSVs for each form type in
	the output directory. The paths of the outputted files are:
</p>
<ul>
	<li><code>{'{'}output directory{'}'}/{'{'}filing id{'}'}/{'{'}form type{'}'}.csv</code></li>
</ul>
<p>You can also pipe the output of another command in by following this usage:</p>
<pre><code
		>[some command] | fastfec [flags] &lt;id&gt; [output directory=output]
	</code></pre>
<h3>Flags</h3>
<p>The CLI supports the following flags:</p>
<ul>
	<li>
		<code>--include-filing-id</code> / <code>-i</code>: if this flag is passed, then the generated
		output will include a column at the beginning of every generated file called
		<code>filing_id</code> that gets passed the filing ID. This can be useful for bulk uploading CSVs
		into a database
	</li>
	<li><code>--silent</code> / <code>-s</code> : suppress all non-error output messages</li>
	<li>
		<code>--warn</code> / <code>-w</code> : show warning messages (e.g. for rows with unexpected numbers
		of fields or field types that don't match exactly)
	</li>
	<li>
		<code>--no-stdin</code> / <code>-x</code>: disable receiving piped input from other programs
		(stdin)
	</li>
	<li>
		<code>--print-url</code> / <code>-p</code>: print URLs from docquery.fec.gov (these URLs can be
		downloaded and then passed to FastFEC as a file)
	</li>
</ul>
<p>
	The short form of flags can be combined, e.g. <code>-is</code> would include filing IDs and suppress
	output.
</p>
<h3>Examples</h3>
<p><code>fastfec -s 13360 fastfec_output/</code></p>
<ul>
	<li>
		This will run FastFEC in silent mode, download and parse filing ID 13360, and store the output
		in CSV files at <code>fastfec_output/13360/</code>.
	</li>
</ul>
<h4>Time benchmarks</h4>
<p>Using massive <code>1464847.fec</code> (8.4gb) on an M1 MacBook Air</p>
<ul>
	<li>1m 42s</li>
</ul>

<h4>Presentation slides</h4>

<p>
	We presented FastFEC at <a
		href="https://www.ire.org/training/conferences/nicar-2024/"
		target="_blank">NICAR 2024</a
	>. You can view the slides
	<a
		href="https://docs.google.com/presentation/d/1pYTWafyQAZsm7XhXCkmEsAxpz1YkXXYbXv5iUKD4G1Y/edit?usp=sharing"
		target="_blank">here</a
	>.
</p>

<p>
	We also presented FastFEC at <a
		href="https://www.ire.org/training/conferences/nicar-2022/"
		target="_blank">NICAR 2022</a
	>. You can view the more outdated slides
	<a
		href="https://docs.google.com/presentation/d/14kYmNsK4vf2hoy2h2_2rw0zyqhgTExhhTBk3JGCKqiY/edit?usp=sharing"
		target="_blank">here</a
	>.
</p>

<h4>Source code</h4>
<p>
	<a href="https://github.com/washingtonpost/FastFEC" target="_blank"
		>github.com/washingtonpost/FastFEC</a
	>
</p>

<style>
	a {
		color: #35639b;
	}
</style>
