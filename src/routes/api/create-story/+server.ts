import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
	const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
	const data = await request.json();

	const session = await locals.auth.validate();

	if (!session) {
		return error(401, { message: 'You must have an account do that' });
	}

	const userId = session?.user.userId;
	const storyId = uuidv4();

	const description = data.description;
	const beginner_request =
		data.option === 'beginner'
			? 'Please make the story at least 10 sentences long and use beginner vocabulary'
			: '';
	const intermediate_request =
		data.option === 'intermediate'
			? 'Please make the story at least 15 sentences long and use intermediate vocabulary'
			: '';
	const advanced_request =
		data.option === 'advanced'
			? 'Please make the story at least 20 sentences long and use advanced vocabulary'
			: '';

	let question = `
    Can you please write a short story in Egyptian Arabic for someone who is trying to learn the language.

    Can you please make sure that the story is in the Egyptian dialect, this is EXTREMELY important
    - for example use "مش" instead of "ليس" for "is not"
    - use أصحاب instead of صديق for "friend"
    - use جنينة for park

    here are some example words and phrases that you can use:

1) Hello. : ahlan.

.أهلاً

2) Goodbye. : salam.

.سلام

3) Please. : lw sma7t.

.لو سمح

4) Thank you. : shokran.

.شكراُ


5) You’re welcome. : nawart.

.نورت

6) Yes. : aywa.

.أيوة

7) No. : laa.

.لا

8) Help. : mosa3da.

.مساعدة

9) Today. : elnaharda.

.النهاردة

10) Tomorrow. : bokra.

.بكرة

11) One time. : mra wa7da.

.مرة واحدة

12) Yesterday. : embare7.

.امبارح

13) Hour / s. : sa3a / sa3at.

.ساعة/ ساعات 


14) Year / s. : sana / sineen.

.سنة / سنين 

15) Day / s. : youm / ayem.

.يوم/ ايام

16) Week / s. : asbo3 / asabe3.

.أسبوع/ أسابيع

17) Before. : 8abl.

.قبل

18) Time. : wa8t.

.وقت

19) Weather. : algaw.

.الجو

20) Here. : hena.

.هنا

21) There. : henak.

.هناك

22) Now. : dlwa8ty.

.دلوقتي

23) Place. : makan.

.مكان

24) School / Schools. : madarsa / madares. (fem)

.مدرسة / مدارس

25) Shop / Shops. : mahal / mahallat. (masc)

.محل / محلات

26) Bathroom / Bathrooms. : hammam / hammamet. (masc)

.حمام / حمامات

27) City / Cities. : madyna / modon. (fem)

.مدينة / مدن

28) Country / Countries. : balad / belad. (fem)

.بلد / بلاد


29) Thing. : haga / hagat.

.حاجة /حاجات  

30) Nothing. : wala haga.

.ولا حاجة

31) Something. : 7aga mo3yna.

.حاجة معينة

32) This…. : dy / da.

…دي / دا


33) Water. : mayya (fem)

.مية

34) House / Houses. : byt / byot. (masc)

.بيت / بيوت

35) Car / Cars. : 3rabya / 3arabiyat. (fem)

.عربية / عربيات

36) Language / Languages: logha / loghat. (fem)

.لغة / لغات


37) Movie / Movies. : fylm / aflam. (masc)

.فيلم / أفلام

38) Man / Men. : ragel / reggala. (masc)

.راجل / رجالة

39) Woman / Women. : set / setat. (fem)

.ست / ستات

40) Boy / Boys. : 3yel / 3eyal. (masc)

.عيل / عيال

41) Girl / Girls. : bent / banat. (fem)

.بنت / بنات

42) Friend / s. : saheb – saheba / sohab. (fem / masc)

.صاحب – صاحبة / صحاب


43) Person / People. : wahed / nas. (masc)

.واحد / ناس

44) Family / Families. : 3yla / 3a2lat. (fem)

.
    Can you make sure that you generate the sentences in Egyptian arabic, english, and transliteration.

    ${beginner_request}${intermediate_request}${advanced_request}

    Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that the output looks like the below object in JSON format:

    {
      title: {arabic: string, english: string},;
      description: {arabic: string, english: string};
      sentences: [];
    }
    where each sentence looks like 

        arabic: {text: string},
        english: { text: string},
        transliteration: {text: string},
  `;

	if (description) {
		question += `Can you use ${description} as the theme of the story..`;
	}

	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: 'system', content: question }],
			response_format: { type: 'json_object' },
			model: 'gpt-4o-mini'
		});

		const story = completion.choices[0].message.content;
		console.log({ story });

		try {
			await db
				.insertInto('generated_story')
				.values({
					id: storyId,
					user_id: userId || '',
					title: data.title,
					description: data.description,
					difficulty: data.option,
					story_body: story, // Ensure story_body is a JSON object
					created_at: new Date().getTime()
				})
				.executeTakeFirst();

			console.log({ storyId });
			return json({ storyId: storyId });
		} catch (e) {
			console.log({ e });
			return error(500, { message: 'Something went wrong' });
		}
	} catch (e) {
		console.log({ e });
		return error(500, { message: 'Something went wrong' });
	}
};
