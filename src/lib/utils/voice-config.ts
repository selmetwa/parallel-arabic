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