import { convertStory } from '$lib/helpers/convert-to-story';

const story = {
  title: "Omar and Sarah",
  arabicTitle: "عُمَر وسَارة",
  english: "Omar and Sarah were best friends who lived in a small city.Every morning, Omar woke up early and brushed his teeth with toothpaste.After that, he had a quick breakfast with his family, usually eating toast and jam.Then, he put on his school uniform and walked to school, waving to neighbours on the way. Sarah, on the other hand, liked to start her day by listening to her favourite songs.She brushed her long hair and had cereal for breakfast.After getting ready, she walked to school too.Omar and Sarah met outside the school gates and went inside together.They sat next to each other in class, where they learned about numbers, letters, and interesting stories. During recess, Omar and Sarah played games with their friends.They loved to run and laugh together.After a fun day at school, they walked home together, talking about their favourite parts of the day.At home, Omar and Sarah did their homework and helped their families with simple chores.Before bedtime, they read stories or watched cartoons, dreaming about the adventures the next day would bring.",
  arabic: "عُمَر وسَارة كانوا أَعَزّ أَصْحَاب، سَاكْنين في مَدِينة صُغَيَّرَة.كُل يُوم الصُّبْح، عُمَر كان بيصْحَى بَدْرِي ويغْسِل أَسْنَانُه بمَعْجُون الأسْنَان.بعد كِده، بياكل فِطَار سَرِيع مَعَ أُسْرِتُه، عَادَةً بياكُل عِيش تُوست و مِرَبَّى.بعد كده، بيلبس زِيِّ المَدْرَسَة بتاعه وبيمشي للمَدْرَسَة ويشَاوِر للجِيرَان في طَرِيقُه. سارة، من النَّاحْيَة التَّانْية، كانت بتحب تبْدَأ يُومْهَا بإنَّهَا تِسْمَع أَغَانِيهَا المُفَضَّلة.كانت بتْسَرَّح شَعْرَها الطَّوِيل وتاكُل كُورن فِليكس للفِطَار.بَعْد ما تِجْهَز، كانت بتمشي للمَدْرَسَة هِيَّ كَمَان.عُمَر وسَارَة كانوا بيتْقَابْلوا بَرَّه بَوَّابة المَدْرَسة ويِدْخُلُوا مَعَ بَعْض.كانوا بيقعْدُوا جَنْب بَعْض وبيتَعَّلِمُوا عَن الأرْقَام، و الحُرُوف ، و قِصَصَ مُثِيرَة للإهْتِمَام.خِلَال الفُسْحَة، عُمَر وسَارَة كانوا بيلْعَبوا ألْعَاب مَعَ أصْحَابْهُم.هم كانوا بيحِبُّوا يجْرُوا ويضْحَكُوا مَعَ بَعض.بَعد يُوم مُمْتِع في المَدْرَسَة، كانوا بيمْشُوا للبيت مَعَ بَعْض ويتْكَلِّمُوا عَن الجُزْء المُفَضَّل مِن اليوم.في البيت، عُمر وسَارة كانوا بيعْمِلوا الوَاجِب بتاعْهُم، ويسَاعْدُوا أُسْرِتهم فِي شُغْل البيت.قَبل مَعَاد النُوم، كانوا بِيقْرُوا قِصَص أو يتْفَرَّجُوا على كَارْتُون وهم بيحْلَمُوا بالمُغَامَرَات اللي هيجِيبْها اليُوم اللي بَعْدُه.",
  transliteration: "Omar we sarah kano a3az as7ab, sakneen fe madeena soghayyara. Kol youm el sob7, Omar kan beyes7a badry we yeghsel asnanoh be ma3goun el asnan. Ba3d keda beyakol fetar saree3 ma3a osretoh, 3adatan beyakol 3esh toast we merabba. Ba3d keda beyelbes zey el madrasa beta3oh we beyemshy lel madrasa we yeshawer lel geran fe taree’oh. Sara, 3ala el na7ya el tanya, kanet bet7eb tebda’ youmha be ennaha tesma3 aghaneeha el mofaddala.Kanet betsarra7 sha3raha el taweel we takoul corn flakes lel fetaar.Ba3d ma teghaz, kanet betemshy lel madrasa heya kaman.Omar we Sarah kano beyet’ablo barra bawabet el madrasa we yedkholo ma3a ba3d.Kano beyeo3do ganb ba3d we yet3allemo 3an el arqam we el 7orouf we qesas mosera lel ehtemam. Khelal el fos7a, Omar we Sarah kano beyel3abo al3ab ma3a as7abhom.Homma kano bey7ebbo yegro we yed7ako ma3a ba3d.Ba3d youm momte3 fel madrasa, kano beyemsho lel bait ma3a ba3d we yetkallemo 3an el goz’ el mofaddal men el youm.Fel bait, Omar we Sarah kano beye3melo el wageb beta3hom, we yesa3do osrethom fe shoghl el bait.Abl ma3aad el noum, kano beye’ro qesas aw yetfarrago 3ala cartoon we homma beye7lamo bel moghamarat elly haygebha el youm elly ba3doh.",
  keyWords: [
    "مَدِينة= City = Madeena",
    "الصُبْح = Morning = Elsob7",
    "الصُبْح = Morning = sob7",
    "بدْرِي =Early = Badry",
    "أسْنان= Teeth = Asnan",
    "أسْنان= Teeth = Asnan",
    "مَعْجُون الأسْنَان =Tooth paste = Ma3goun el asnan",
    "للفِطَار= Breakfast = Fetaar",
    "فِطَار= Breakfast = Fetar",
    "مِرَبَّى =Jam = Merabba",
    "زِيِّ المَدْرَسَة =School uniform = Zey el madrasa",
    "للجِيرَان= Neighbours = Geran",
    'أَغَانِيهَا= Songs = aghaneeha',
    "بَوَّابة =Gates = Bawabet",
    "الأرْقَام = numbers = arqam",
    "الحُرُوف = letters = 7orouf",
    "قِصَصَ = Stories = Qesas",
    "الفُسْحَة= Recess = Fos7a",
    "الوَاجِب = Homework = Wageb",
    "ألْعَاب = Games = Al3ab",
    "بالمُغَامَرَات= Adventures = Moghamarat"
  ]
}

export const load = async () => {
  const formattedStory = convertStory(story);

	return {
    formattedStory: formattedStory,
	};
};