// Dialect-specific voice configuration
export const getVoiceConfig = (dialect: string) => {
  switch (dialect) {
    case 'fusha':
      return {
        voice: 'Mona',
        voice2: 'Mo Wiseman',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'egyptian-arabic':
      return {
        voice: 'Haytham - Conversation',
        voice2: 'Haytham - Conversation',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'levantine':
      return {
        voice: 'Sara - Kind & Expressive',
        voice2: 'Audrey', // Placeholder - second voice for conversations
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'darija':
      return {
        voice: 'Ghizlane - Moroccan Darija Dialect',
        voice2: 'Youssef', // Placeholder - second voice for conversations
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'iraqi':
      return {
        voice: 'Mona', // Using Levantine voice as fallback for Iraqi
        voice2: 'Mustafa', // Placeholder - second voice for conversations
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'khaleeji':
      return {
        voice: 'Ghawi',
        voice2: 'Fatima', // Placeholder - second voice for conversations
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    default:
      // Default to Egyptian voice for backwards compatibility
      return {
        voice: 'Haytham',
        voice2: 'Masry', // Placeholder - second voice for conversations
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
  }
};

// Generate speaker names based on dialect and voice gender
export const getSpeakerNames = (dialect: string): { speaker1: string; speaker2: string } => {
  const voiceConfig = getVoiceConfig(dialect);
  
  // Determine gender based on voice names
  const getGender = (voiceName: string): 'male' | 'female' => {
    const femaleVoices = ['mona', 'sara', 'ghizlane', 'fatima', 'audrey'];
    const lowerVoiceName = voiceName.toLowerCase();
    return femaleVoices.some(name => lowerVoiceName.includes(name)) ? 'female' : 'male';
  };

  const voice1Gender = getGender(voiceConfig.voice);
  const voice2Gender = getGender(voiceConfig.voice2);

  // Dialect-specific name pools
  const names = {
    'egyptian-arabic': {
      male: ['أحمد', 'محمد', 'حسن', 'علي', 'عمر', 'يوسف', 'مصطفى', 'خالد', 'كريم', 'تامر'],
      female: ['فاطمة', 'عائشة', 'مريم', 'زينب', 'هاجر', 'نورا', 'سارة', 'دينا', 'مها', 'ريم']
    },
    'levantine': {
      male: ['أحمد', 'محمد', 'عمر', 'كريم', 'طارق', 'سامر', 'نديم', 'باسل', 'وسام', 'رامي'],
      female: ['سارة', 'ليلى', 'نور', 'رنا', 'هلا', 'ريم', 'نادين', 'لارا', 'دانا', 'مايا']
    },
    'darija': {
      male: ['يوسف', 'عبد الرحمن', 'أمين', 'سعيد', 'حسن', 'رشيد', 'كريم', 'محمد', 'عمر', 'إدريس'],
      female: ['فاطمة', 'خديجة', 'عائشة', 'زهرة', 'نعيمة', 'سعاد', 'غزلان', 'أمينة', 'حليمة', 'حسناء']
    },
    'fusha': {
      male: ['أحمد', 'محمد', 'عبد الله', 'إبراهيم', 'يوسف', 'عمر', 'علي', 'حسن', 'خالد', 'سالم'],
      female: ['فاطمة', 'عائشة', 'خديجة', 'زينب', 'مريم', 'سارة', 'نور', 'آمنة', 'ليلى', 'هند']
    },
    'iraqi': {
      male: ['حيدر', 'علي', 'محمد', 'أحمد', 'حسن', 'عباس', 'مصطفى', 'كرار', 'حسين', 'عمار'],
      female: ['زينب', 'فاطمة', 'مريم', 'نور', 'رقية', 'هدى', 'سارة', 'عائشة', 'زهراء', 'آلاء']
    },
    'khaleeji': {
      male: ['سالم', 'محمد', 'عبد الله', 'فهد', 'خالد', 'عبد العزيز', 'طلال', 'فيصل', 'عبد الرحمن', 'نواف'],
      female: ['نورا', 'سارة', 'ريم', 'هند', 'منى', 'عبير', 'فاطمة', 'مها', 'أمل', 'لطيفة']
    }
  };

  const dialectNames = names[dialect as keyof typeof names] || names['egyptian-arabic'];
  
  // Get random names based on voice genders
  const speaker1Names = dialectNames[voice1Gender];
  const speaker2Names = dialectNames[voice2Gender];
  
  const speaker1 = speaker1Names[Math.floor(Math.random() * speaker1Names.length)];
  const speaker2 = speaker2Names[Math.floor(Math.random() * speaker2Names.length)];
  
  return { speaker1, speaker2 };
}; 