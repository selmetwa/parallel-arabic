<script lang="ts">
	type Props = {
		word: {
			egyptianArabic: string;
			english: string;
			egyptianArabicTransliteration: string;
		};
	};

	const { word }: Props = $props();
	const root = $derived(word.egyptianArabic.split(/[-–]/)[0].trim());
	const transliteratedRoot = $derived(word.egyptianArabicTransliteration.split(/[-–]/)[0].trim());
</script>
<div class="mb-12 flex flex-col sm:flex-row gap-4 items-center">
  <div class="flex-1">
    <h1 class="text-[64px] text-text-300">
      {word.egyptianArabic.split(/[-–]/)[1].trim()}
    </h1>
    <div class="flex flex-row gap-4">
      <h2 class="text-text-300 text-[32px]">{word.english}</h2>
      <h2 class="text-text-300 text-[32px]">({word.egyptianArabicTransliteration.split(/[-–]/)[1].trim()})</h2>
    </div>
  </div>
  <div class="flex-1">
    <table class="imperative-table">
      <thead>
        <tr>
          <th>Imperative</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="arabic">{root}</td>
          <td>{transliteratedRoot}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<table class="arabic-table">
	<thead>
		<tr>
			<th>Pronoun</th>
			<th>Past</th>
			<th>Present</th>
			<th>Future</th>
			<th>Infinitive</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>انا</td>
			<td>{root}ت</td>
			<td>ب{root}</td>
			<td>ها{root}</td>
			<td>ا{root}</td>
		</tr>
		<tr>
			<td>انتَ</td>
			<td>{root}ت</td>
			<td>بت{root}</td>
			<td>هت{root}</td>
			<td>ت{root}</td>
		</tr>
		<tr>
			<td>انتِ</td>
			<td>{root}تي</td>
			<td>بت{root}ي</td>
			<td>هت{root}ي</td>
			<td>تي{root}</td>
		</tr>
		<tr>
			<td>هو</td>
			<td>{root}</td>
			<td>بي{root}</td>
			<td>هي{root}</td>
			<td>ي{root}</td>
		</tr>
		<tr>
			<td>هي</td>
			<td>{root}ت</td>
			<td>بت{root}</td>
			<td>هت{root}</td>
			<td>ت{root}</td>
		</tr>
		<tr>
			<td>احنا</td>
			<td>{root}نا</td>
			<td>بن{root}</td>
			<td>هن{root}</td>
			<td>ن{root}</td>
		</tr>
		<tr>
			<td>انتو</td>
			<td>{root}تو</td>
			<td>بت{root}و</td>
			<td>هت{root}و</td>
			<td>ت{root}و</td>
		</tr>
		<tr>
			<td>هم</td>
			<td>{root}و</td>
			<td>بي{root}و</td>
			<td>هي{root}و</td>
			<td>ي{root}و</td>
		</tr>
	</tbody>
</table>

<table class="transliterated-table">
	<thead>
		<tr>
			<th>Pronoun</th>
			<th>Past</th>
			<th>Present</th>
			<th>Future</th>
			<th>Infinitive</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Ana (I)</td>
			<td>{transliteratedRoot}t</td>
			<td>Ba{transliteratedRoot}</td>
			<td>Ha{transliteratedRoot}</td>
			<td>a{transliteratedRoot}</td>
		</tr>
		<tr>
			<td>Enta (You masc)</td>
			<td>{transliteratedRoot}t</td>
			<td>Bete{transliteratedRoot}</td>
			<td>Hate{transliteratedRoot}</td>
			<td>te{transliteratedRoot}</td>
		</tr>
		<tr>
			<td>Enty (You feminine)</td>
			<td>{transliteratedRoot}ty</td>
			<td>Bete{transliteratedRoot}y</td>
			<td>Hate{transliteratedRoot}y</td>
			<td>te{transliteratedRoot}y</td>
		</tr>
		<tr>
			<td>Howa (He)</td>
			<td>{transliteratedRoot}</td>
			<td>Beye{transliteratedRoot}</td>
			<td>Haye{transliteratedRoot}</td>
			<td>ye{transliteratedRoot}</td>
		</tr>
		<tr>
			<td>Heya (She)</td>
			<td>{transliteratedRoot}et</td>
			<td>Bete{transliteratedRoot}</td>
			<td>Hate{transliteratedRoot}</td>
			<td>te{transliteratedRoot}</td>
		</tr>
		<tr>
			<td>E7na (We)</td>
			<td>{transliteratedRoot}na</td>
			<td>Bene{transliteratedRoot}</td>
			<td>Hane{transliteratedRoot}</td>
			<td>ne{transliteratedRoot}</td>
		</tr>
		<tr>
			<td>Ento (You Plural)</td>
			<td>{transliteratedRoot}to</td>
			<td>Bete{transliteratedRoot}o</td>
			<td>Hate{transliteratedRoot}o</td>
			<td>te{transliteratedRoot}o</td>
		</tr>
		<tr>
			<td>Homma (They)</td>
			<td>{transliteratedRoot}o</td>
			<td>Beye{transliteratedRoot}o</td>
			<td>Haye{transliteratedRoot}o</td>
			<td>ye{transliteratedRoot}o</td>
		</tr>
	</tbody>
</table>

<style>
	.arabic-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 20px;
		th,
		td {
			border: 1px solid var(--tile5);
			padding: 12px 4px;
			text-align: center;
			color: var(--text-300);
			font-size: 22px;
		}

		th {
			font-size: 16px;
		}
		tr:nth-child(even) {
			background-color: var(--tile3);
		}
		th {
			background-color: var(--tile6);
		}
	}

  .transliterated-table {
    width: 100%;
		border-collapse: collapse;
		margin-bottom: 20px;
		th,
		td {
			border: 1px solid var(--tile5);
			padding: 12px 4px;
			text-align: center;
			color: var(--text-300);
			font-size: 16px;
		}

		th {
			font-size: 16px;
		}
		tr:nth-child(even) {
			background-color: var(--tile3);
		}
		th {
			background-color: var(--tile6);
		}
  }

  .imperative-table{
    width: 100%;
		border-collapse: collapse;
		margin-bottom: 20px;
		th,
		td {
			border: 1px solid var(--tile5);
			padding: 12px 4px;
			text-align: center;
			color: var(--text-300);
			font-size: 16px;
		}
    .arabic {
      font-size: 22px;
    }
		th {
			font-size: 16px;
		}
		tr:nth-child(even) {
			background-color: var(--tile3);
		}
		th {
			background-color: var(--tile6);
		}
  }
</style>
