// Norwegian language learning challenges

export const CHALLENGE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

export const dailyChallenges = [
  {
    id: 'daily_1',
    type: CHALLENGE_TYPES.DAILY,
    title: 'Morning Greeting',
    description: 'Say "God morgen" (Good morning) to a stranger',
    norwegianPhrase: 'God morgen!',
    englishTranslation: 'Good morning!',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'daily_2',
    type: CHALLENGE_TYPES.DAILY,
    title: 'Thank You',
    description: 'Thank someone in Norwegian',
    norwegianPhrase: 'Tusen takk!',
    englishTranslation: 'Thank you very much!',
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'daily_3',
    type: CHALLENGE_TYPES.DAILY,
    title: 'Ask for Directions',
    description: 'Ask "Where is...?" to someone',
    norwegianPhrase: 'Hvor er...?',
    englishTranslation: 'Where is...?',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'daily_4',
    type: CHALLENGE_TYPES.DAILY,
    title: 'Order Coffee',
    description: 'Order a coffee in Norwegian at a café',
    norwegianPhrase: 'Kan jeg få en kaffe, takk?',
    englishTranslation: 'Can I have a coffee, please?',
    difficulty: 'medium',
    points: 15
  },
  {
    id: 'daily_5',
    type: CHALLENGE_TYPES.DAILY,
    title: 'Introduction',
    description: 'Introduce yourself to someone new',
    norwegianPhrase: 'Jeg heter... Hva heter du?',
    englishTranslation: 'My name is... What is your name?',
    difficulty: 'medium',
    points: 15
  }
];

export const weeklyChallenges = [
  {
    id: 'weekly_1',
    type: CHALLENGE_TYPES.WEEKLY,
    title: 'Have a Conversation',
    description: 'Have a 5-minute conversation with a stranger in Norwegian',
    norwegianPhrase: 'Kan vi snakke litt?',
    englishTranslation: 'Can we talk a bit?',
    difficulty: 'medium',
    points: 50
  },
  {
    id: 'weekly_2',
    type: CHALLENGE_TYPES.WEEKLY,
    title: 'Ask About the Weather',
    description: 'Start a conversation about the weather with 3 different people',
    norwegianPhrase: 'Hvordan er været i dag?',
    englishTranslation: 'How is the weather today?',
    difficulty: 'medium',
    points: 50
  },
  {
    id: 'weekly_3',
    type: CHALLENGE_TYPES.WEEKLY,
    title: 'Shopping Challenge',
    description: 'Complete a shopping trip speaking only Norwegian',
    norwegianPhrase: 'Hva koster dette?',
    englishTranslation: 'How much does this cost?',
    difficulty: 'hard',
    points: 75
  },
  {
    id: 'weekly_4',
    type: CHALLENGE_TYPES.WEEKLY,
    title: 'Public Transport',
    description: 'Ask for help with public transportation in Norwegian',
    norwegianPhrase: 'Hvilken buss går til...?',
    englishTranslation: 'Which bus goes to...?',
    difficulty: 'hard',
    points: 75
  }
];

export const monthlyChallenges = [
  {
    id: 'monthly_1',
    type: CHALLENGE_TYPES.MONTHLY,
    title: 'Make a Norwegian Friend',
    description: 'Have multiple conversations with the same person and exchange contact information',
    norwegianPhrase: 'Kan vi bli venner?',
    englishTranslation: 'Can we be friends?',
    difficulty: 'hard',
    points: 200
  },
  {
    id: 'monthly_2',
    type: CHALLENGE_TYPES.MONTHLY,
    title: 'Join a Local Event',
    description: 'Participate in a local Norwegian event and interact with at least 5 people',
    norwegianPhrase: 'Kan jeg delta?',
    englishTranslation: 'Can I participate?',
    difficulty: 'hard',
    points: 200
  },
  {
    id: 'monthly_3',
    type: CHALLENGE_TYPES.MONTHLY,
    title: 'Phone Conversation',
    description: 'Make a phone call in Norwegian (e.g., booking, inquiry)',
    norwegianPhrase: 'Jeg vil gjerne bestille...',
    englishTranslation: 'I would like to book...',
    difficulty: 'very_hard',
    points: 250
  }
];

// Get a random challenge by type
export const getRandomChallenge = (type) => {
  let challenges;
  switch (type) {
    case CHALLENGE_TYPES.DAILY:
      challenges = dailyChallenges;
      break;
    case CHALLENGE_TYPES.WEEKLY:
      challenges = weeklyChallenges;
      break;
    case CHALLENGE_TYPES.MONTHLY:
      challenges = monthlyChallenges;
      break;
    default:
      challenges = dailyChallenges;
  }
  return challenges[Math.floor(Math.random() * challenges.length)];
};

// Get all challenges
export const getAllChallenges = () => {
  return {
    daily: dailyChallenges,
    weekly: weeklyChallenges,
    monthly: monthlyChallenges
  };
};
