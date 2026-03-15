import type { TriviaQuestion } from './types';

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // SPORTS - EASY
  { id: 'sports-1-1', category: 'sports', difficulty: 1, prompt: 'How many points is a touchdown worth in American football (before extra point)?', options: ['3', '6', '7', '2'], correctIndex: 1 },
  { id: 'sports-1-2', category: 'sports', difficulty: 1, prompt: 'In basketball, how many points is a free throw worth?', options: ['1', '2', '3', '4'], correctIndex: 0 },
  { id: 'sports-1-3', category: 'sports', difficulty: 1, prompt: 'How many players are on a soccer team on the field at once?', options: ['9', '10', '11', '12'], correctIndex: 2 },

  // SPORTS - MEDIUM
  { id: 'sports-2-1', category: 'sports', difficulty: 2, prompt: 'In tennis, what is the score name for 40-40?', options: ['Advantage', 'Deuce', 'Love', 'Break'], correctIndex: 1 },
  { id: 'sports-2-2', category: 'sports', difficulty: 2, prompt: 'Which country won the 2018 FIFA World Cup?', options: ['Brazil', 'Germany', 'France', 'Argentina'], correctIndex: 2 },
  { id: 'sports-2-3', category: 'sports', difficulty: 2, prompt: 'How many innings are in a standard MLB game?', options: ['7', '8', '9', '10'], correctIndex: 2 },

  // SPORTS - HARD
  { id: 'sports-3-1', category: 'sports', difficulty: 3, prompt: 'What is the distance of an Olympic marathon?', options: ['26.2 miles', '24.8 miles', '25 miles', '27 miles'], correctIndex: 0 },
  { id: 'sports-3-2', category: 'sports', difficulty: 3, prompt: 'In golf, what is one stroke under par on a hole called?', options: ['Eagle', 'Birdie', 'Bogey', 'Albatross'], correctIndex: 1 },
  { id: 'sports-3-3', category: 'sports', difficulty: 3, prompt: 'What does NBA stand for?', options: ['National Basket Association', 'National Basketball Association', 'North Basketball Alliance', 'National Ball Association'], correctIndex: 1 },

  // FOOD - EASY
  { id: 'food-1-1', category: 'food', difficulty: 1, prompt: 'Which fruit is known for being yellow and curved?', options: ['Apple', 'Pear', 'Banana', 'Lemon'], correctIndex: 2 },
  { id: 'food-1-2', category: 'food', difficulty: 1, prompt: 'What main ingredient is used to make french fries?', options: ['Potato', 'Carrot', 'Corn', 'Rice'], correctIndex: 0 },
  { id: 'food-1-3', category: 'food', difficulty: 1, prompt: 'Sushi is most associated with which country?', options: ['China', 'Korea', 'Thailand', 'Japan'], correctIndex: 3 },

  // FOOD - MEDIUM
  { id: 'food-2-1', category: 'food', difficulty: 2, prompt: 'Guacamole is primarily made from what?', options: ['Avocado', 'Tomato', 'Cucumber', 'Peas'], correctIndex: 0 },
  { id: 'food-2-2', category: 'food', difficulty: 2, prompt: 'What kind of pastry is used for a traditional croissant?', options: ['Shortcrust', 'Puff pastry', 'Filo', 'Biscuit dough'], correctIndex: 1 },
  { id: 'food-2-3', category: 'food', difficulty: 2, prompt: 'Mozzarella is traditionally made from the milk of which animal in Italy?', options: ['Cow', 'Goat', 'Sheep', 'Water buffalo'], correctIndex: 3 },

  // FOOD - HARD
  { id: 'food-3-1', category: 'food', difficulty: 3, prompt: 'What is the main spirit in a classic mojito?', options: ['Vodka', 'Rum', 'Tequila', 'Gin'], correctIndex: 1 },
  { id: 'food-3-2', category: 'food', difficulty: 3, prompt: 'Which grain is used to make polenta?', options: ['Wheat', 'Rice', 'Corn', 'Barley'], correctIndex: 2 },
  { id: 'food-3-3', category: 'food', difficulty: 3, prompt: 'What is the Japanese term for grilled skewered chicken?', options: ['Ramen', 'Sashimi', 'Yakitori', 'Tempura'], correctIndex: 2 },

  // GENERAL - EASY
  { id: 'general-1-1', category: 'general', difficulty: 1, prompt: 'How many days are in a leap year?', options: ['365', '366', '364', '367'], correctIndex: 1 },
  { id: 'general-1-2', category: 'general', difficulty: 1, prompt: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Mercury'], correctIndex: 2 },
  { id: 'general-1-3', category: 'general', difficulty: 1, prompt: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2 },

  // GENERAL - MEDIUM
  { id: 'general-2-1', category: 'general', difficulty: 2, prompt: 'What is H2O commonly known as?', options: ['Hydrogen', 'Oxygen', 'Water', 'Salt'], correctIndex: 2 },
  { id: 'general-2-2', category: 'general', difficulty: 2, prompt: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctIndex: 1 },
  { id: 'general-2-3', category: 'general', difficulty: 2, prompt: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },

  // GENERAL - HARD
  { id: 'general-3-1', category: 'general', difficulty: 3, prompt: 'What is the chemical symbol for gold?', options: ['Gd', 'Ag', 'Au', 'Go'], correctIndex: 2 },
  { id: 'general-3-2', category: 'general', difficulty: 3, prompt: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2 },
  { id: 'general-3-3', category: 'general', difficulty: 3, prompt: 'Who developed the theory of relativity?', options: ['Newton', 'Einstein', 'Tesla', 'Bohr'], correctIndex: 1 },

  // MEDIA - EASY
  { id: 'media-1-1', category: 'media', difficulty: 1, prompt: 'Which movie features the song "Let It Go"?', options: ['Moana', 'Frozen', 'Tangled', 'Encanto'], correctIndex: 1 },
  { id: 'media-1-2', category: 'media', difficulty: 1, prompt: 'Who lives in a pineapple under the sea?', options: ['Patrick Star', 'Mickey Mouse', 'SpongeBob SquarePants', 'Bugs Bunny'], correctIndex: 2 },
  { id: 'media-1-3', category: 'media', difficulty: 1, prompt: 'In anime, Goku is a character from which series?', options: ['Naruto', 'One Piece', 'Dragon Ball', 'Bleach'], correctIndex: 2 },

  // MEDIA - MEDIUM
  { id: 'media-2-1', category: 'media', difficulty: 2, prompt: 'What house is Harry Potter sorted into?', options: ['Slytherin', 'Ravenclaw', 'Hufflepuff', 'Gryffindor'], correctIndex: 3 },
  { id: 'media-2-2', category: 'media', difficulty: 2, prompt: 'Which TV show features a coffee shop named Central Perk?', options: ['Seinfeld', 'Friends', 'The Office', 'How I Met Your Mother'], correctIndex: 1 },
  { id: 'media-2-3', category: 'media', difficulty: 2, prompt: 'Naruto’s dream is to become what?', options: ['Jonin', 'Anbu captain', 'Hokage', 'Sensei'], correctIndex: 2 },

  // MEDIA - HARD
  { id: 'media-3-1', category: 'media', difficulty: 3, prompt: 'In "The Lord of the Rings", what is the name of Aragorn’s sword reforged from Narsil?', options: ['Glamdring', 'Andúril', 'Sting', 'Orcrist'], correctIndex: 1 },
  { id: 'media-3-2', category: 'media', difficulty: 3, prompt: 'In "Attack on Titan", what are the walls called?', options: ['Maria, Rose, Sina', 'Alpha, Beta, Gamma', 'North, East, South', 'A, B, C'], correctIndex: 0 },
  { id: 'media-3-3', category: 'media', difficulty: 3, prompt: 'Who directed the movie "Inception"?', options: ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Ridley Scott'], correctIndex: 2 },

  // GEOGRAPHY - EASY
  { id: 'geo-1-1', category: 'geography', difficulty: 1, prompt: 'What is the capital of the United States?', options: ['New York', 'Washington, D.C.', 'Los Angeles', 'Chicago'], correctIndex: 1 },
  { id: 'geo-1-2', category: 'geography', difficulty: 1, prompt: 'Which continent is Egypt in?', options: ['Asia', 'Europe', 'Africa', 'South America'], correctIndex: 2 },
  { id: 'geo-1-3', category: 'geography', difficulty: 1, prompt: 'Which country is famous for the Eiffel Tower?', options: ['Italy', 'France', 'Spain', 'Germany'], correctIndex: 1 },

  // GEOGRAPHY - MEDIUM
  { id: 'geo-2-1', category: 'geography', difficulty: 2, prompt: 'Which U.S. state is known as the "Sunshine State"?', options: ['California', 'Texas', 'Florida', 'Arizona'], correctIndex: 2 },
  { id: 'geo-2-2', category: 'geography', difficulty: 2, prompt: 'Mount Everest lies on the border of Nepal and which region/country?', options: ['India', 'Bhutan', 'China/Tibet', 'Pakistan'], correctIndex: 2 },
  { id: 'geo-2-3', category: 'geography', difficulty: 2, prompt: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correctIndex: 3 },

  // GEOGRAPHY - HARD
  { id: 'geo-3-1', category: 'geography', difficulty: 3, prompt: 'Which river runs through Baghdad?', options: ['Nile', 'Tigris', 'Euphrates', 'Jordan'], correctIndex: 1 },
  { id: 'geo-3-2', category: 'geography', difficulty: 3, prompt: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1 },
  { id: 'geo-3-3', category: 'geography', difficulty: 3, prompt: 'Which African country has the most population?', options: ['Egypt', 'South Africa', 'Nigeria', 'Ethiopia'], correctIndex: 2 },
];
