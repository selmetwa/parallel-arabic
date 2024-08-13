<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    const verbs = await fetch('https://egyptian-arabic-vocab-selmetwa.koyeb.app/vocab/verbs');
    const data = await verbs.json();

    console.log({data});
  });
</script>
<table>
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
          <td>Ana</td>
          <td>t</td>
          <td>Ba</td>
          <td>Ha</td>
          <td>a</td>
      </tr>
      <tr>
          <td>Enta</td>
          <td>t</td>
          <td>Bete</td>
          <td>Hate</td>
          <td>te</td>
      </tr>
      <tr>
          <td>Enty</td>
          <td>ty</td>
          <td>Bete–y</td>
          <td>Hate–y</td>
          <td>te–y</td>
      </tr>
      <tr>
          <td>Howa</td>
          <td>-</td>
          <td>Beye</td>
          <td>Haye</td>
          <td>ye</td>
      </tr>
      <tr>
          <td>Heya</td>
          <td>et</td>
          <td>Bete</td>
          <td>Hate</td>
          <td>te</td>
      </tr>
      <tr>
          <td>E7na</td>
          <td>na</td>
          <td>Bene</td>
          <td>Hane</td>
          <td>ne</td>
      </tr>
      <tr>
          <td>Ento</td>
          <td>to</td>
          <td>Bete–o</td>
          <td>Hate–o</td>
          <td>te–o</td>
      </tr>
      <tr>
          <td>Homma</td>
          <td>o</td>
          <td>Beye–o</td>
          <td>Haye–o</td>
          <td>ye–o</td>
      </tr>
  </tbody>
</table>

<table>
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
          <td>ت</td>
          <td>با</td>
          <td>ها</td>
          <td>ا</td>
      </tr>
      <tr>
          <td>انتَ</td>
          <td>ت</td>
          <td>بت</td>
          <td>هت</td>
          <td>ت</td>
      </tr>
      <tr>
          <td>انتِ</td>
          <td>تي</td>
          <td>بت-ي</td>
          <td>هت-ي</td>
          <td>تي</td>
      </tr>
      <tr>
          <td>هو</td>
          <td>-</td>
          <td>بي</td>
          <td>هي</td>
          <td>ي</td>
      </tr>
      <tr>
          <td>هي</td>
          <td>ت</td>
          <td>بت</td>
          <td>هت</td>
          <td>ت</td>
      </tr>
      <tr>
          <td>احنا</td>
          <td>نا</td>
          <td>بن</td>
          <td>هن</td>
          <td>ن</td>
      </tr>
      <tr>
          <td>انتو</td>
          <td>تو</td>
          <td>بت-و</td>
          <td>هت-و</td>
          <td>ت-و</td>
      </tr>
      <tr>
          <td>هما</td>
          <td>و</td>
          <td>بي-و</td>
          <td>هي-و</td>
          <td>ي-و</td>
      </tr>
  </tbody>
</table>

<style>
  table {
      width: 100%;
      border-collapse: collapse;
  }
  th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 36px;
  }
  th {
      background-color: #f2f2f2;
  }
</style>