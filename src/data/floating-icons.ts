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
  /** Video (in /public) that plays in place of the icon while hovered/focused. */
  hoverVideo?: string;
  /** Image (in /public) shown enlarged in place of the icon while hovered/focused. */
  hoverImage?: string;
  /** While hovered/focused, pulse the other icons to hoverVideo's beat and light up the screen with disco colors. */
  discoOnHover?: boolean;
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
    hoverVideo: "croissant.mp4",
  },
  {
    id: "hotpot",
    file: "hotpot.png",
    alt: "Hotpot dinner",
    title: "We love hotpot!",
    blurb: "Our second date was at a hotpot restaurant, which turned out to be the first of many.",
    size: 3,
  },
  {
    id: "basketball",
    file: "basketball.png",
    alt: "Basketball",
    title: "First impressions last",
    blurb: "Jon wore basketball shorts to our first date. He still dreams of joining the NBA.",
    size: 2,
    hoverVideo: "firstdate.mp4",
  },
  {
    id: "suitcase",
    file: "suitcase.png",
    alt: "Pink carry-on suitcase",
    title: "Save the date, we hope you'll celebrate with us",
    blurb: "Pack your bags: we're tying the knot.",
    size: 3,
    special: true,
  },
  {
    id: "yoga-mat",
    file: "yoga-mat.png",
    alt: "Rolled yoga mat",
    title: "Saturday yoga",
    blurb: "One thing we look forward to every week is our Saturday yoga. Jon swears he levitates.",
    size: 2,
    hoverVideo: "yoga.mp4",
  },
  {
    id: "grass",
    file: "grass.png",
    alt: "Tuft of grass",
    title: "Grounding",
    blurb: "We joke that Jon is Cam's dog. She walks him to the park to touch grass.",
    size: 0,
    hoverVideo: "grounding.mp4",
  },
  {
    id: "sunglasses",
    file: "sunglasses.png",
    alt: "Sunglasses",
    title: "Sunshine",
    blurb: "Jon loved Cam's bright energy on their first date.",
    size: 1,
    hoverVideo: "sunshine.mp4",
    discoOnHover: true,
  },
  {
    id: "cap",
    file: "cap.png",
    alt: "Baseball cap with a parrot patch",
    title: "Whose cap is it anyway?",
    blurb: "We have matching caps and somehow still end up stealing each other's.",
    size: 1,
    hoverVideo: "cap.mp4",
  },
  {
    id: "poster",
    file: "poster.png",
    alt: "Ted Lasso BELIEVE poster",
    title: "Believe",
    blurb: "One of the first shows we watched together was Ted Lasso. Many people say Jon is the Asian Ted Lasso.",
    size: 2,
  },
  {
    id: "huggy",
    file: "huggy.png",
    alt: "Painting of two figures hugging cheek to cheek",
    title: "Cheek to cheek",
    blurb: "A painting Cam made of us. We love cheek to cheek and huggy! Jon's painting for comparison:",
    size: 2,
    hoverImage: "jonpainting-hover.jpg",
  },
  {
    id: "roses",
    file: "roses.png",
    alt: "Bouquet of roses",
    title: "The bouquet",
    blurb: "We got engaged with a big, beautiful bouquet of roses at Jon's parents' home in LA.",
    size: 2,
    hoverImage: "engagement-hover.jpg",
  },
];
