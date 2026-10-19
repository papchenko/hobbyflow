export const BOARD_GAME_CATEGORIES = [
  "Strategy",
  "Family",
  "Party",
  "Cooperative",
  "Competitive",
  "Card Game",
  "Deck Building",
  "Deck Construction",
  "Worker Placement",
  "Eurogame",
  "Ameritrash",
  "Abstract",
  "Adventure",
  "Exploration",
  "Dungeon Crawler",
  "Wargame",
  "Deduction",
  "Social Deduction",
  "Bluffing",
  "Hidden Roles",
  "Negotiation",
  "Trading",
  "Auction",
  "Economic",
  "Engine Building",
  "Resource Management",
  "Area Control",
  "Territory Building",
  "Tile Placement",
  "Pattern Building",
  "Set Collection",
  "Drafting",
  "Dice Game",
  "Push Your Luck",
  "Roll and Write",
  "Flip and Write",
  "Racing",
  "Sports",
  "Trivia",
  "Word Game",
  "Memory",
  "Dexterity",
  "Real-Time",
  "Puzzle",
  "Escape Room",
  "Detective",
  "Mystery",
  "Horror",
  "Survival",
  "Fantasy",
  "Science Fiction",
  "Historical",
  "Civilization",
  "City Building",
  "Farming",
  "Nature",
  "Animals",
  "Educational",
  "Children's",
  "Storytelling",
  "Role-Playing",
  "Campaign",
  "Legacy",
  "Solo",
  "Other",
];

export const BOARD_GAME_LANGUAGES = [
  "Ukrainian",
  "English",
  "German",
  "Italian",
  "French",
  "Polish",
  "Spanish",
  "Czech",
  "Slovak",
  "Romanian",
  "Japanese",
  "Chinese",
  "Korean",
  "Other",
];

export const BOARD_GAME_CONDITIONS = [
  {
    value: "very_good",
    label: "Very Good",
    description: "Almost like new, with minimal signs of use.",
  },
  {
    value: "good",
    label: "Good",
    description: "Normal signs of use, fully playable.",
  },
  {
    value: "poor",
    label: "Poor",
    description: "Visible wear or damage; defects must be disclosed.",
  },
  {
    value: "very_poor",
    label: "Very Poor",
    description: "Significant wear or damage.",
  },
];

export const BOARD_GAME_COMPLETENESS = [
  {
    value: "complete",
    label: "Complete",
    description: "All original components are included.",
  },
  {
    value: "missing_nonessential",
    label: "Missing Non-Essential Parts",
    description: "Some non-essential parts are missing.",
  },
  {
    value: "incomplete",
    label: "Incomplete",
    description: "Essential components are missing.",
  },
];

export const getBoardGameConditionLabel = (value) =>
  BOARD_GAME_CONDITIONS.find((item) => item.value === value)
    ?.label || "Unknown";

export const getBoardGameCompletenessLabel = (value) =>
  BOARD_GAME_COMPLETENESS.find((item) => item.value === value)
    ?.label || "Unknown";

export const getBoardGameListingType = (game) => {
  if (game?.listingType) return game.listingType;

  const hasRental =
    game?.isLendingAvailable ??
    (Number(game?.priceLending) > 0);

  return hasRental ? "sale_and_rental" : "sale";
};
