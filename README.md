## Parallel Arabic is a language learning tool for Egyptian Arabic 
### Reading
Parallel Arabic enables users to read arabic texts alongside the same text in English.

Each story features a dictionary of key words, transliteration of the text, and full native audio recordings, creating a fully self-contained learning environment without the need for outside resources.
<img width="800" alt="Screenshot 2024-04-01 at 12 15 29 AM" src="https://github.com/selmetwa/parallel-arabic/assets/46908343/7d8f87a4-c6d1-412c-b2f5-6a969ad176de">

### Writing 
Practice writing over 4000 words, with realtime spellchecking. The tool contains a fully featured arabic virtual keyboard, built for english speakers.

<img width="799" alt="Screenshot 2024-04-01 at 12 18 48 AM" src="https://github.com/selmetwa/parallel-arabic/assets/46908343/a66d135b-84db-4554-8872-8dbcb2b4c35a">


#### Tools used
- Sveltekit
- [API for Egyptian Arabic Vocabulary](https://egyptian-arabic-vocab-selmetwa.koyeb.app/)
- [Fully Featured Arabic Virtual Keyboard](https://selmetwa.github.io/arabic-virtual-keyboard-demo/)
#### TODO
Vercel does not allow `sqlite` databases, so I have to port the DB to postgres in order to re-add authentication and the saving of words.
