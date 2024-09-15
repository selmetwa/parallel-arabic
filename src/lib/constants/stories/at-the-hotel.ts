const arabic = [
  { speaker: "جورج", text: "مساء الخير" },
  { speaker: "موظف الاستقبال", text: "مساء الخير يا فندم، أقدر أساعد حضرتك إزاي" },
  { speaker: "جورج", text: "لو سمحت أنا عايز أوضة لشخص واحد، هقعد ٣ أيام" },
  { speaker: "موظف الاستقبال", text: "تمام يا فندم، ممكن تملأ بيانات حضرتك في الورقة دي وتديني بطاقتك الشخصية أو الباسبور؟" },
  { speaker: "جورج", text: "تمام، اتفضل" },
  { speaker: "فيليبس", text: "جورج؟!" },
  { speaker: "جورج", text: "ايه ده، فيليبس! بتعمل ايه هنا؟" },
  { speaker: "فيليبس", text: "(يضحك) أنا قاعد في الفندق هنا الفترة دي. هي سيلڨيا اقترحت عليك الفندق ده ولا ايه؟" },
  { speaker: "جورج", text: "مظبوط، هي فعلًا قالتلي إنه مكان جميل ونضيف وإني هلاقي فيه كل حاجة، بس مقالتليش إني هلاقيك هنا!" },
  { speaker: "فيليبس", text: "(يضحك بشدة) لو سمحت ممكن تخلي مستر جورج يقعد في نفس الدور بتاعي، أنا في أوضة ۲۱۱" },
  { speaker: "موظف الاستقبال", text: "حاضر يا فندم، حضرتك سعر الأوضة لفرد واحد ١٨٠٠ جنيه في اليوم" },
  { speaker: "جورج", text: "تمام، ممكن أدفع بالڨيزا؟" },
  { speaker: "موظف الاستقبال", text: "أيوه يا فندم، احنا بنقبل الدفع بالڨيزا" },
  { speaker: "جورج", text: "اتفضل، امتى ممكن آخد الأوضة؟" },
  { speaker: "موظف الاستقبال", text: "حضرتك استريح في الريسيبشن، دقيقتين والعامل هييجي يآخد منك الشنطة ويطلَّعَك الأوضة" },
  { speaker: "جورج", text: "شكرًا" },
  { speaker: "فيليبس", text: "تعالى نقضي السهرة مع بعض بقى، سنتين مشوفكش معقولة؟!" },
  { speaker: "جورج", text: "طب خليني أطلع أنام ساعة وأنزلك عشان جسمي مكسر ومرهق أوي" },
  { speaker: "فيليبس", text: "ماشي، هو أنا كنت هروح مع صاحبتي أتمشى شوية وكنا هنيجي هنا بليل عشان بكرة الصبح هنتحرك في جروب .. هنروح الأهرامات" },
  { speaker: "جورج", text: "طب حلو أوي أنا هآجي معاكم، الساعة كام بكرة؟" },
  { speaker: "فيليبس", text: "١٠ هنتحرك" },
  { speaker: "جورج", text: "حلو" },
  { speaker: "فيليبس", text: "اطلع ريّح ومستنيك لما تصحى تكلمني بقى" },
  { speaker: "عامل الفندق", text: "حضرتك أول مرة تزور مصر" },
  { speaker: "فيليبس", text: "أنا عايش هنا أصلاً بس واخد يومين اجازة أرَوَّق على نفسي" },
  { speaker: "عامل الفندق", text: "نورت يا أفندم" },
  { speaker: "فيليبس", text: "ده نورك .. هو  مش الأوضة دي بتبص على النيل برضه؟" },
  { speaker: "عامل الفندق", text: "مظبوط يا أفندم .. دي واحدة من أحسن الأوض اللي في الفندق" },
  { speaker: "عامل الفندق", text: "اتفضل مستر جورج .. فيه هنا تلفزيون، تلاجة، والحمام من هنا .. باسوورد الواي فاي على الورقة إللي فيها إرشادات الفندق إللي على الترابيزة دي" },
  { speaker: "جورج", text: "شكرًا بجد" },
  { speaker: "عامل الفندق", text: "التليفون كمان هنا، لو احتجت أي حاجة ممكن تكلم الريسيبشن" },
  { speaker: "جورج", text: "شكرًا، هو صحيح المطعم نظامه ايه، أنا نسيت أسأل تحت" },
  { speaker: "عامل الفندق", text: "حضرتك فيه وجبتين مجانًا من ضمن خدمات الإقامة بالفندق: الفطار من الساعة ٩ لحد ١١. والغداء من الساعة ٢ لحد الساعة ٥.. المطعم بيبقى أوبن بوفيه وممكن حضرتك تآكل اللي انت عايزه، بس لو بتفضل أكل معين تقدر تطلبه من الشيف المطعم" },
  { speaker: "جورج", text: "جميل أوي شكرًا" },
  { speaker: "عامل الفندق", text: "العفو، أي خدمة تانية؟" },
  { speaker: "جورج", text: "آه ياريت بس تشغل التلفزيون عشان عايز أشوف فيه قنوات ايه؟" },
  { speaker: "عامل الفندق", text: "أهو .. الزرار اللي على الشمال ده هو اللي بيفتح ال" },
  { speaker: "جورج", text: "تمام حلو أوي ..  (يعطي العامل بقشيش) اتفضل دي حاجة بسيطة علشانك" },
  { speaker: "عامل الفندق", text: "ملوش داعي التعب يا أفندم" },
  { speaker: "جورج", text: "لا معلش" },
  { speaker: "عامل الفندق", text: "شكراً لذوقك .. مع السلامة يا أفندم" },
  { speaker: "جورج", text: "مع السلامة" }
];

const english = [
  {
    "speaker": "George",
    "text": "Good evening."
  },
  {
    "speaker": "Receptionist",
    "text": "Good evening, sir. How can I help you?"
  },
  {
    "speaker": "George",
    "text": "I'd like a single room for three days, please."
  },
  {
    "speaker": "Receptionist",
    "text": "Certainly, sir. Could you fill in your details on this form and give me your ID or passport?"
  },
  {
    "speaker": "George",
    "text": "Sure, here you go."
  },
  {
    "speaker": "Phillips",
    "text": "George?!"
  },
  {
    "speaker": "George",
    "text": "What? Phillips! What are you doing here?"
  },
  {
    "speaker": "Phillips",
    "text": "(laughs) I’m staying at the hotel here for a while. Did Sylvia suggest this hotel to you?"
  },
  {
    "speaker": "George",
    "text": "Exactly, she did tell me it’s a nice, clean place where I can find everything I need, but she didn’t mention I’d find you here!"
  },
  {
    "speaker": "Phillips",
    "text": "(laughs heartily) Please, can you put Mr. George on the same floor as mine? I’m in room 211."
  },
  {
    "speaker": "Receptionist",
    "text": "Sure, sir. The price for a single room is 1,800 pounds per day."
  },
  {
    "speaker": "George",
    "text": "Okay, can I pay with Visa?"
  },
  {
    "speaker": "Receptionist",
    "text": "Yes, sir, we do accept Visa."
  },
  {
    "speaker": "George",
    "text": "Here you go. When can I get the room?"
  },
  {
    "speaker": "Receptionist",
    "text": "Please take a seat in the reception area. In a couple of minutes, a staff member will come to take your luggage and take you to your room."
  },
  {
    "speaker": "George",
    "text": "Thank you."
  },
  {
    "speaker": "Phillips",
    "text": "Let’s spend the evening together. It’s been two years since I last saw you!"
  },
  {
    "speaker": "George",
    "text": "Let me take a nap for an hour and then I will come down, I’m very exhausted."
  },
  {
    "speaker": "Phillips",
    "text": "Okay, I was planning to go for a walk with my friend and we were planning to come here at night because we’re joining in a group tomorrow morning to go to the pyramids."
  },
  {
    "speaker": "George",
    "text": "That’s great. I’ll come with you. What time are you leaving tomorrow?"
  },
  {
    "speaker": "Phillips",
    "text": "We’re leaving at 10."
  },
  {
    "speaker": "George",
    "text": "Great."
  },
  {
    "speaker": "Phillips",
    "text": "Go relax, and call me when you wake up."
  },
  {
    "speaker": "Hotel Staff",
    "text": "Is this your first time visiting Egypt?"
  },
  {
    "speaker": "Phillips",
    "text": "I live here, actually, but I’m taking a couple of days off to unwind."
  },
  {
    "speaker": "Hotel Staff",
    "text": "Welcome, sir."
  },
  {
    "speaker": "Phillips",
    "text": "Thanks… Doesn’t this room also have a view of the Nile?"
  },
  {
    "speaker": "Hotel Staff",
    "text": "That’s correct, sir. It’s one of the best rooms in the hotel."
  },
  {
    "speaker": "Hotel Staff",
    "text": "Here you are, Mr. George. There’s a TV, a fridge, and the bathroom is over here. The Wi-Fi password is on the hotel instructions sheet on the table."
  },
  {
    "speaker": "George",
    "text": "Thank you very much."
  },
  {
    "speaker": "Hotel Staff",
    "text": "The phone is here, too. If you need anything, you can call the reception."
  },
  {
    "speaker": "George",
    "text": "Thanks. By the way, what’s the restaurant’s schedule? I forgot to ask downstairs."
  },
  {
    "speaker": "Hotel Staff",
    "text": "You have two complimentary meals included in your stay: breakfast from 9 to 11 a.m. and lunch from 2 to 5 p.m. The restaurant offers an open buffet where you can eat whatever you like, but if you prefer a specific dish, you can order it from the restaurant chef."
  },
  {
    "speaker": "George",
    "text": "That’s great, thank you."
  },
  {
    "speaker": "Hotel Staff",
    "text": "You’re welcome. Anything else I can help you with?"
  },
  {
    "speaker": "George",
    "text": "Oh, could you please turn on the TV? I’d like to see what channels are available."
  },
  {
    "speaker": "Hotel Staff",
    "text": "Here you go. The button on the left turns on the receiver."
  },
  {
    "speaker": "George",
    "text": "Perfect, thanks. (gives a tip to the staff) This is a small tip for you."
  },
  {
    "speaker": "Hotel Staff",
    "text": "No need to trouble yourself, sir."
  },
  {
    "speaker": "George",
    "text": "Please, I insist."
  },
  {
    "speaker": "Hotel Staff",
    "text": "Thank you for your kindness. Goodbye, sir."
  },
  {
    "speaker": "George",
    "text": "Goodbye."
  }
]

const transliteration = [
  { speaker: "George", text: "Masa2 el 5eir" },
  { speaker: "Mowazzaf el este2bal", text: "masa2 el 5eir ya fandem, etfaddaal" },
  { speaker: "George", text: "Law sama7t ana 3ayez oda le shakhs wa7ed, ha3od talat ayam" },
  { speaker: "Mowazzaf el este2bal", text: "tamem ya fandem, momken temla bayanat 7adratak fel wara2a di we teddini bata2tak el shakhseyya aw el basboor?" },
  { speaker: "George", text: "tamem, etfaddal" },
  { speaker: "Philips", text: "George?!" },
  { speaker: "George", text: "Eh da, Philips! Bete3mel eh hena?" },
  { speaker: "Philips", text: "(yed7ak) ana 2a3ed fel fondu2 hena el fatra di. Heya Silvia ektara7et 3alek el fondu2 da wala eh?" },
  { speaker: "George", text: "Mazboot, heya fa3lan 2aletli enno makan gameel we nedeef we eni hala2i feeh kol 7aga, bas ma2aletleesh eni hala2eek hena!" },
  { speaker: "Philips", text: "(yed7ak beshedda) Law sama7t momken tekhalli mister George ye3od fe nafs el door bta3i, ana fe oda 211" },
  { speaker: "Mowazzaf el este2bal", text: "7ader ya fandem, 7adretak se3r el oda le fard wa7ed 1800 geneeh fel youm" },
  { speaker: "George", text: "Tamam, momken adfa3 bel visa?" },
  { speaker: "Mowazzaf el este2bal", text: "Aywa ya fandem, e7na ben2bal el dafa3 bel visa" },
  { speaker: "George", text: "Etfaddal, emta momken akhod el oda?" },
  { speaker: "Mowazzaf el este2bal", text: "7adretak esterayya7 fel reception, de2i2ten we el 3amel hayeegy yakhod mennak el shanta we yetalla3ak el oda" },
  { speaker: "George", text: "Shokran" },
  { speaker: "Philips", text: "Ta3ala ne2di el sahra ma3 ba3d ba2a, santeen mashofaksh ma32oola?!" },
  { speaker: "George", text: "Tab khaleeni atla3 anam sa3a we anzellak 3ashan gesmi mekassar we morhaq awi" },
  { speaker: "Philips", text: "Mashi, howa ana kont haroo7 ma3 sa7bety atmasha shewaya we kona haneegy hena beleel 3ashan bokra el sob7 hant7arrak fe group .. hanroo7 el ahramat" },
  { speaker: "George", text: "Tab 7elw awi ana haagy ma3akum, el sa3a kam bokra?" },
  { speaker: "Philips", text: "3ashra hant7arek" },
  { speaker: "George", text: "7elw" },
  { speaker: "Philips", text: "Etla3 rayya7 we mestanneek lama tes7a tekallemni ba2a" },
  { speaker: "3amel el fondu2", text: "7adretak awel mara tezoor Masr?" },
  { speaker: "Philips", text: "Ana 3ayesh hena aslan bas wakhed youmain agaza arawa2 3ala nafsi" },
  { speaker: "3amel el fondu2", text: "Nawart ya fandem" },
  { speaker: "Philips", text: "Da noorak .. howa mish el oda di betbos 3ala el neel bardoo?" },
  { speaker: "3amel el fondu2", text: "Mazboot ya fandem .. di wa7da men a7san el owad elli fel fondu2 …." },
  { speaker: "3amel el fondu2", text: "Etfaddal mister George .. fe hena telfezyon, talaaga, wel 7amam men hena .. baswoord el wi-fi 3ala el wara2a elli feeha ershadat el fondu2 elli 3ala el tarabeeza di" },
  { speaker: "George", text: "Shokran begad" },
  { speaker: "3amel el fondu2", text: "El telefon kaman hena, law e7tagt ay 7aga momken tekallem el reception" },
  { speaker: "George", text: "Shokran, howa sa7ee7 el mat3am nezamo eh, ana neseet asa2l ta7t .." },
  { speaker: "3amel el fondu2", text: "7adretak feeh wagbetein maganan men demn khadamat el eqama bel fondu2: el fetar men el sa3a 9 le 7ad 11. wel ghada men el sa3a 2 le 7ad el sa3a 5.. el mat3am beyeb2a open buffet we momken 7adretak ta2kol elly enta 3ayzo, bas law betfaddal akl mo3ayyan te2dar tetlobo men el chef el mat3am" },
  { speaker: "George", text: "Gameel awi shokran" },
  { speaker: "3amel el fondu2", text: "El 3afo, ay khedma tany?" },
  { speaker: "George", text: "Ah ya reet bas teshaghal el telfezyon 3ashan 3ayez ashof feeh kanawat eh?" },
  { speaker: "3amel el fondu2", text: "Aho .. el zorar elly 3ala el shemal da howa elly beyefta7 el receiver" },
  { speaker: "George", text: "Tamam 7elw awi .. (yo3ty el 3amel ba2sheesh) Etfaddal di 7aga baseeta 3alashanak" },
  { speaker: "3amel el fondu2", text: "Maloosh da3y el ta3ab ya fandem" },
  { speaker: "George", text: "La ma3lesh" },
  { speaker: "3amel el fondu2", text: "Shokran lezo2ak .. ma3a el salama ya fandem" },
  { speaker: "George", text: "Ma3a el salama" }
];

const a = arabic.length;

const output = [];

for (let i = 0; i < a; i++) {
  output.push({
    arabic: arabic[i],
    english: english[i],
    transliteration: transliteration[i]
  })
}

export const atTheHotel = {
  audio: '/audio/at-the-hotel/full-audio.wav',
  title: {
    arabic: "بالفندق",
    english: "At the Hotel",
    transliteration: "Fel fondo2"
 },
 sentences: output
}