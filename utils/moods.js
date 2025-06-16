// utils/moods.js
export const MOOD_OPTIONS = [
  // Very positive (9-10)
  { emoji: '😄', label: 'very happy', score: 10 },
  { emoji: '🤩', label: 'excited', score: 9.8 },
  { emoji: '😊', label: 'happy', score: 9.5 },
  { emoji: '🥰', label: 'loved', score: 9.3 },
  { emoji: '✨', label: 'proud', score: 9.0 },
  { emoji: '😁', label: 'cheerful', score: 9.0 },
  
  // Positive (7-8.9)
  { emoji: '😎', label: 'confident', score: 8.7 },
  { emoji: '🙏', label: 'thankful', score: 8.5 },
  { emoji: '😌', label: 'calm', score: 8.2 },
  { emoji: '🧘', label: 'peaceful', score: 8.0 },
  { emoji: '🙂', label: 'good', score: 7.5 },
  { emoji: '😀', label: 'pleased', score: 7.2 },
  { emoji: '👍', label: 'fine', score: 7.0 },
  
  // Neutral (5-6.9)
  { emoji: '💭', label: 'thoughtful', score: 6.5 },
  { emoji: '🤔', label: 'curious', score: 6.0 },
  { emoji: '😐', label: 'okay', score: 5.5 },
  { emoji: '🙂', label: 'neutral', score: 5.0 }, // Default neutral mood
  
  // Negative (3-4.9)
  { emoji: '😕', label: 'unsure', score: 4.8 },
  { emoji: '😴', label: 'tired', score: 4.5 },
  { emoji: '😟', label: 'worried', score: 4.0 },
  { emoji: '😔', label: 'down', score: 3.7 },
  { emoji: '😫', label: 'stressed', score: 3.5 },
  { emoji: '😥', label: 'sad', score: 3.0 },
  
  // Very negative (1-2.9)
  { emoji: '😢', label: 'very sad', score: 2.5 },
  { emoji: '😠', label: 'angry', score: 2.0 },
  { emoji: '😨', label: 'scared', score: 1.8 },
  { emoji: '😭', label: 'upset', score: 1.5 },
  { emoji: '😞', label: 'hopeless', score: 1.2 },
  { emoji: '💔', label: 'hurt', score: 1.0 }
];

// Ensure DEFAULT_MOOD is correctly assigned, especially if 'neutral' might be missing.
let defaultMood = MOOD_OPTIONS.find(m => m.label === 'neutral');
if (!defaultMood) {
  console.error("Neutral mood not found in MOOD_OPTIONS! Using a hardcoded default.");
  defaultMood = { emoji: '🙂', label: 'neutral', score: 5 };
}
export const DEFAULT_MOOD = defaultMood;

// Helper to get mood by label
export const getMoodByLabel = (label) => {
  if (!label) return DEFAULT_MOOD;
  return MOOD_OPTIONS.find(m => m.label.toLowerCase() === label.toLowerCase()) || DEFAULT_MOOD;
};

// Get mood score category for visualization/grouping
export const getMoodCategory = (score) => {
  if (score >= 8) return 'positive';
  if (score >= 6) return 'slightly-positive';
  if (score >= 4) return 'neutral';
  if (score >= 2) return 'slightly-negative';
  return 'negative';
};

// Find closest mood by score
export const getMoodByScore = (score) => {
  if (typeof score !== 'number') return DEFAULT_MOOD;
  
  // Find the mood with the closest score
  let closestMood = DEFAULT_MOOD;
  let smallestDiff = Math.abs(DEFAULT_MOOD.score - score);
  
  MOOD_OPTIONS.forEach(mood => {
    const diff = Math.abs(mood.score - score);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestMood = mood;
    }
  });
  
  return closestMood;
};
