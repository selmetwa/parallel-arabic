
const arabic = [
  {
    speaker: "جورج",
    text: "مساء الخير .. عندك ترابيزة لإتنين لو سمحت؟"
  },
  {
    speaker: "مدير المطعم",
    text: "مساء النور يا أفندم، آه طبعاً. تحب تقعد بره ولا جوه؟"
  },
  {
    speaker: "جورج",
    text: "إيه رأيك يا صوفيا؟"
  },
  {
    speaker: "صوفيا",
    text: "أظن خلينا بره"
  },
  {
    speaker: "جورج",
    text: "أنا قولت كده برضه. ممكن ترابيزة بره لو سمحت."
  },
  {
    speaker: "مدير المطعم",
    text: "تمام يا أفندم .. بقترح تقعدوا على الترابيزة اللي هناك دي بعيد عن الدوشة، إيه رأيكوا؟"
  },
  {
    speaker: "صوفيا",
    text: "حلوة إضاءة المكان ده"
  },
  {
    speaker: "جورج",
    text: "جميل (....) ممكن المنيو لو سمحت؟"
  },
  {
    speaker: "مدير المطعم",
    text: "اتفضل، بقترح عليكوا طبق اليوم وهو \"طبق الحمام المحشي مع شوربة العدس\" ..  إحنا بنعمله كويس أوي وبنقترحه على كل الزباين"
  },
  {
    speaker: "صوفيا",
    text: "طيب عظيم، ممكن أجربه، نجربه ولا إيه؟"
  },
  {
    speaker: "جورج",
    text: "آه يلا بينا، خلينا نشوف"
  },
  {
    speaker: "مدير المطعم",
    text: "ماشي يا أفندم، كده اتنين طبق حمام محشي، واتنين شوربة عدس، هل تحبوا معاه أي إضافات؟"
  },
  {
    speaker: "جورج",
    text: "ممكن سلطة خضرا كمان.. وشوية مخلل لو سمحت"
  },
  {
    speaker: "مدير المطعم",
    text: "تمام يا أفندم .. تحبوا أي حلويات؟"
  },
  {
    speaker: "صوفيا",
    text: "آه. عندك أم علي؟ أنا نفسي أجربها من ساعة ما جيت مصر"
  },
  {
    speaker: "مدير المطعم",
    text: "آه يا أفندم .. المطعم بتاعنا مشهور بيها .. هتعجِبك أوي إن شاء الله"
  },
  {
    speaker: "جورج",
    text: "طيب مادام كده .. خليهم اتنين لو سمحت"
  },
  {
    speaker: "مدير المطعم",
    text: "تمام يا أفندم .. تحبوا تشربوا حاجة مع الأكل؟"
  },
  {
    speaker: "صوفيا",
    text: "ممكن عصير برتقان لو سمحت؟"
  },
  {
    speaker: "جورج",
    text: "وأنا هاخد إزازة مية صغيرة"
  },
  {
    speaker: "صوفيا",
    text: "خليهم إزازتين لو سمحت"
  },
  {
    speaker: "مدير المطعم",
    text: "تمام يا أفندم، ربع ساعة بالظبط والأوردر يبقى عند حضرتكوا"
  },
  {
    speaker: "صوفيا",
    text: "أوه جميل، الأكل شكله لذيذ"
  },
  {
    speaker: "مدير المطعم",
    text: "اتفضلوا يا أفندم .. بالهنا والشفا"
  },
  {
    speaker: "جورج وصوفيا (في نفس الوقت)",
    text: "الله يهنيك"
  },
  {
    speaker: "مدير المطعم",
    text: "الأكل عجبكم يا أفندم؟"
  },
  {
    speaker: "صوفيا",
    text: "آه العدس تحفة، أول مرة أجربه"
  },
  {
    speaker: "جورج",
    text: "والحمام حلو، مِسْتِوي كويس .. فعلًا وجبة حلوة .. ممكن الحساب لو سمحت؟"
  },
  {
    speaker: "مدير المطعم",
    text: "حضرتك تحب تدفع كاش ولا فيزا؟"
  },
  {
    speaker: "جورج",
    text: "ممكن كاش لو سمحت"
  },
  {
    speaker: "مدير المطعم",
    text: "تحت أمرك يا أفندم .. ثانية واحدة .. اتفضل الفاتورة"
  },
  {
    speaker: "جورج",
    text: "شكراً .. خلي الباقي عشانك"
  },
  {
    speaker: "مدير المطعم",
    text: "شكراً يا أفندم، شرفتونا، بنتمنى نشوفكوا مرة تانية"
  }
];

const english = [
  {
    speaker: "George",
    text: "Good evening. Do you have a table for two, please?"
  },
  {
    speaker: "Restaurant Manager",
    text: "Good evening, sir. Yes, of course. Would you like to sit outside or inside?"
  },
  {
    speaker: "George",
    text: "What do you think, Sophia?"
  },
  {
    speaker: "Sophia",
    text: "I think let's stay outside."
  },
  {
    speaker: "George",
    text: "I thought the same. A table outside, please."
  },
  {
    speaker: "Restaurant Manager",
    text: "Alright, sir. I suggest you sit at that table over there, away from the noise. What do you think?"
  },
  {
    speaker: "Sophia",
    text: "The lighting here is nice."
  },
  {
    speaker: "George",
    text: "Beautiful (....) Can we have the menu, please?"
  },
  {
    speaker: "Restaurant Manager",
    text: "Here you go. I suggest you try today's special, which is stuffed pigeon with lentil soup. We make it very well and recommend it to all our customers."
  },
  {
    speaker: "Sophia",
    text: "Great, I’d like to try it. Should we?"
  },
  {
    speaker: "George",
    text: "Yes, let's go for it. Let's see..."
  },
  {
    speaker: "Restaurant Manager",
    text: "Alright, sir. That's two stuffed pigeons and two lentil soups. Would you like any side dishes?"
  },
  {
    speaker: "George",
    text: "Can we have a green salad and some pickles, please?"
  },
  {
    speaker: "Restaurant Manager",
    text: "Certainly, sir. Would you like any desserts?"
  },
  {
    speaker: "Sophia",
    text: "Yes. Do you have Umm Ali? I’ve been wanting to try it since I came to Egypt."
  },
  {
    speaker: "Restaurant Manager",
    text: "Yes, ma'am. Our restaurant is famous for it. You'll love it, God willing."
  },
  {
    speaker: "George",
    text: "Alright then, make that two, please."
  },
  {
    speaker: "Restaurant Manager",
    text: "Certainly, sir. Would you like something to drink with your meal?"
  },
  {
    speaker: "Sophia",
    text: "Orange juice, please?"
  },
  {
    speaker: "George",
    text: "And I’ll have a small bottle of water."
  },
  {
    speaker: "Sophia",
    text: "Make that two bottles, please."
  },
  {
    speaker: "Restaurant Manager",
    text: "Alright, sir. The order will be ready in fifteen minutes."
  },
  {
    speaker: "Sophia",
    text: "Oh, nice, the food looks delicious."
  },
  {
    speaker: "Restaurant Manager",
    text: "Here you go, sir. Enjoy your meal."
  },
  {
    speaker: "George and Sophia (At the same time)",
    text: "Thank you."
  },
  {
    speaker: "Restaurant Manager",
    text: "Did you enjoy the food, sir?"
  },
  {
    speaker: "Sophia",
    text: "Yes, the lentil soup is amazing. It’s my first time trying it."
  },
  {
    speaker: "George",
    text: "And the pigeon is good and well-cooked. Such a nice meal. Can we have the bill, please?"
  },
  {
    speaker: "Restaurant Manager",
    text: "Would you like to pay in cash or by card?"
  },
  {
    speaker: "George",
    text: "Cash, please."
  },
  {
    speaker: "Restaurant Manager",
    text: "At your service, sir. One moment. Here’s the bill."
  },
  {
    speaker: "George",
    text: "Thank you. Keep the change."
  },
  {
    speaker: "Restaurant Manager",
    text: "Thank you, sir. It was a pleasure having you. We hope to see you again."
  }
];

const transliteration = [
  {
    speaker: "George",
    text: "Msa2 il khair.. 3andak tarabeeza li itneen law sama7t?"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Msa2 innoor ya afandim, aah tab3an. Te7ib ti3od barra wala goowa?"
  },
  {
    speaker: "George",
    text: "Eh ra2yek ya Sofia?"
  },
  {
    speaker: "Sofia",
    text: "Azon khaleena barra"
  },
  {
    speaker: "George",
    text: "Ana 2olt keda bardo. Momken tarabeeza barra law sama7t."
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Tamam ya afandim.. baqtare7 ti3odoo 3ala ittarabeeza illi hinak di be3eed 3an iddawsha, eh ra2yokoo?"
  },
  {
    speaker: "Sofia",
    text: "7elwa ida2et il makan da"
  },
  {
    speaker: "George",
    text: "Gameel (....) momken il menu law sama7t?"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Itfadal, baqtare7 3alikoo Taba2 il yoom w howa 'Taba2 il 7amam il ma7shi ma3 shorbit il 3ads'.. E7na bine3melo kwayes awi o beneqter7o 3ala kol il zabayin"
  },
  {
    speaker: "Sofia",
    text: "Tayeb 3azeem, momken agerabo, negerabo wala eh?"
  },
  {
    speaker: "George",
    text: "Aah yalla beena, khaleena neshoof.."
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Mashi ya afandim, kida itneen Taba2 7amam ma7shi, we itneen shorbat 3ads, hal te7iboo ma3ah ay idafaat?"
  },
  {
    speaker: "George",
    text: "Momken salata 5adra kaman.. we shwayet mekhalil law sama7t"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Tamam ya afandim.. te7iboo ay 7alawiyat?"
  },
  {
    speaker: "Sofia",
    text: "Aah. 3andak omm 3ali? Ana nefsi agarrbha min sa3et ma geet Masr.."
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Aah ya afandim.. il mat3am beta3na mashhoor beeha.. hat3agebek awi in shaa Allah"
  },
  {
    speaker: "George",
    text: "Tayeb madam kida.. khaleehom itneen law sama7t.."
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Tamam ya afandim.. te7iboo tesharboo 7aga ma3 il akl?"
  },
  {
    speaker: "Sofia",
    text: "Momken 3aseer borto2an law sama7t?"
  },
  {
    speaker: "George",
    text: "W ana hakhod izazit maya so3'ayara"
  },
  {
    speaker: "Sofia",
    text: "Khaleehom izazteen law sama7t"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Tamam ya afandim, rob3 sa3a bilzabt wel order yeb2a 3and 7adaratkoo"
  },
  {
    speaker: "Sofia",
    text: "Oh gameel, il akl shaklo lazeez"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Itfaddaloo ya afandim.. bel hana wel shefa"
  },
  {
    speaker: "George w Sofia (fi nafs il wa2t)",
    text: "Allah yihneek"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "il akl 3agabakoo ya afandim?"
  },
  {
    speaker: "Sofia",
    text: "Aah il 3ads to7fa, awel mara agerrabo"
  },
  {
    speaker: "George",
    text: "Wil 7amam 7elw, mistiwie kwayes.. fe3lan wagbah 7elwa.. momken il 7isab law sama7t?"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "7adretak te7ib tedfa3 cash wala visa?"
  },
  {
    speaker: "George",
    text: "Momken cash law sama7t.."
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Ta7t amrak ya afandim.. sania wa7da.. itfadal il fatora"
  },
  {
    speaker: "George",
    text: "Shokran.. 5ali il ba2i 3ashanak"
  },
  {
    speaker: "Mudeer il mat3am",
    text: "Shokran ya afandim, sharraftoona, bantmanna neshoofkoo mara tania"
  }
];

const a = arabic.length;
const e = english.length;
const t = transliteration.length;
console.log({
  a, e, t
})

const output = [];

for (let i = 0; i < a; i++) {
  output.push({
    arabic: arabic[i],
    english: english[i],
    transliteration: transliteration[i]
  })
}

export const atTheRestaurant = {
  audio: '/audio/at-the-restaurant/full-audio.wav',
  title: {
    arabic: 'في المطعم',
    english: 'At the Restaurant',
    transliteration: 'Fi il Mat3am'
  },
  sentences: output
}