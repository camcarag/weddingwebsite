// Copy below is placeholder — personalize each title/blurb, and swap the
// `special` flag to whichever icon should reveal the save-the-date instead
// of the suitcase. Drop matching image files (transparent PNG/WebP, ~400px)
// into /public/icons using these exact filenames.

export type FloatingIconData = {
  id: string;
  file: string;
  alt: string;
  title: string;
  blurb: string;
  size: 0 | 1 | 2 | 3;
  special?: boolean;
  date?: string;
  location?: string;
  cta?: string;
};

export const floatingIcons: FloatingIconData[] = [
  {
    id: "plant",
    file: "plant.png",
    alt: "Potted monstera plant",
    title: "Plant parents",
    blurb: "We don't have any dogs, but we do have a ton of plants. Cam is the primary parent.",
    size: 2,
  },
  {
    id: "phone",
    file: "phone.png",
    alt: "Phone in a blue case",
    title: "Selfie time",
    blurb: "Cam and Jon are selfie experts. If you haven't taken one with us yet, we should fix that.",
    size: 0,
  },
  {
    id: "croissant",
    file: "croissant.png",
    alt: "Croissant",
    title: "Croissant connoisseurs",
    blurb: "We love a good croissant. Our favorites are La Cabra and L'Appartement 4F.",
    size: 1,
  },
  {
    id: "hotpot",
    file: "hotpot.png",
    alt: "Hot pot dinner",
    title: "We love hot pot!",
    blurb: "Our second date was at a hot pot restaurant, which turned out to be the first of many.",
    size: 3,
  },
  {
    id: "basketball",
    file: "basketball.png",
    alt: "Basketball",
    title: "First impressions last",
    blurb: "Jon wore basketball shorts to our first date. He still dreams of joining the NBA.",
    size: 2,
  },
  {
    id: "suitcase",
    file: "suitcase.png",
    alt: "Pink carry-on suitcase",
    title: "Save the date, we hope you'll celebrate with us",
    blurb: "Pack your bags: we're tying the knot.",
    size: 3,
    special: true,
    date: "Month DD, YYYY",
    location: "City, State",
    cta: "Formal invitation to follow",
  },
  {
    id: "yoga-mat",
    file: "yoga-mat.png",
    alt: "Rolled yoga mat",
    title: "Saturday yoga",
    blurb: "One thing we look forward to every week is our Saturday yoga. Jon swears he levitates.",
    size: 2,
  },
  {
    id: "grass",
    file: "grass.png",
    alt: "Tuft of grass",
    title: "Grounding",
    blurb: "We joke that Jon is Cam's dog. She walks him to the park to touch grass.",
    size: 0,
  },
  {
    id: "sunglasses",
    file: "sunglasses.png",
    alt: "Sunglasses",
    title: "Vacation mode",
    blurb: "The second these go on, all group chats become ‘do not disturb.’",
    size: 1,
  },
  {
    id: "cap",
    file: "cap.png",
    alt: "Baseball cap with a parrot patch",
    title: "Whose cap is it anyway?",
    blurb: "We have matching caps and somehow still end up stealing each other's.",
    size: 1,
  },
  {
    id: "bikini",
    file: "bikini.png",
    alt: "Yellow bikini",
    title: "Warm-weather optimism",
    blurb: "Packed for every trip regardless of forecast. It's a mindset.",
    size: 2,
  },
  {
    id: "roses",
    file: "roses.png",
    alt: "Bouquet of roses",
    title: "The bouquet",
    blurb: "We got engaged with a big, beautiful bouquet of roses at Jon's parents' home in LA.",
    size: 2,
  },
];
