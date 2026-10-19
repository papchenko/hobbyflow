export const BOOK_LANGUAGES = [
  "English",
  "Ukrainian",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Portuguese",
  "Dutch",
  "Polish",
  "Czech",
  "Slovak",
  "Hungarian",
  "Romanian",
  "Bulgarian",
  "Serbian",
  "Croatian",
  "Slovenian",
  "Greek",
  "Turkish",
  "Lithuanian",
  "Latvian",
  "Estonian",
  "Finnish",
  "Swedish",
  "Norwegian",
  "Danish",
  "Icelandic",
  "Arabic",
  "Hebrew",
  "Persian",
  "Hindi",
  "Bengali",
  "Urdu",
  "Chinese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Malay",
  "Filipino",
  "Mongolian",
  "Georgian",
  "Armenian",
  "Kazakh",
  "Azerbaijani",
  "Uzbek",
  "Latin",
  "Other",
];

export const BOOK_CONDITIONS = [
  {
    value: "very_good",
    label: "Very Good",
    description:
      "Minimal signs of use. Pages and binding are very well preserved.",
  },
  {
    value: "good",
    label: "Good",
    description:
      "Light signs of use. Minor wear, but no significant defects.",
  },
  {
    value: "poor",
    label: "Poor",
    description:
      "Noticeable wear, marks or minor defects are present.",
  },
  {
    value: "very_poor",
    label: "Very Poor",
    description:
      "Heavy wear or significant damage. Defects should be clearly visible in the photos.",
  },
];

export const getBookConditionLabel = (value) => {
  return (
    BOOK_CONDITIONS.find(
      (condition) => condition.value === value,
    )?.label || "Not specified"
  );
};