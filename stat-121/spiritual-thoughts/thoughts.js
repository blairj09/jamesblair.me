/*
 * Add a new devotional by adding an object to the beginning of this list.
 * `reference` is required. `sections`, `note`, `image`, `sourceUrl`, and
 * `sourceLabel` are optional. Use ordered string sections to preserve
 * paragraph order. Wrap a user-designated quote in {curly braces}; wrap
 * user-requested italic text in *single asterisks*.
 * Dates use YYYY-MM-DD so the newest thoughts sort correctly.
 */
const spiritualThoughts = [
  {
    date: '2026-09-10',
    reference: '2 Nephi 2:26',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/2?lang=eng#:~:text=26%20And%20the,God%20hath%20given.',
    sourceLabel: 'Book of Mormon',
    image: 'images/2026-09-10-agency-watercolor.png',
    imageAlt: 'Abstract watercolor of branching paths and a gentle stream opening into a luminous valley at dawn',
    sections: [
      'And the Messiah cometh in the fulness of time, that he may redeem the children of men from the fall. And because that they are redeemed from the fall they have become free forever, knowing good from evil; {to act for themselves and not to be acted upon}, save it be by the punishment of the law at the great and last day, according to the commandments which God hath given.'
    ]
  },
  {
    date: '2026-09-08',
    reference: 'Patrick Kearon, “Peace and Rest—Even Now”',
    sourceUrl: 'https://speeches.byu.edu/talks/patrick-kearon/peace-and-rest-even-now/',
    sourceLabel: 'BYU devotional',
    image: 'images/peace-and-rest-watercolor.png',
    imageAlt: 'Abstract watercolor landscape of still water, misty mountains, and soft dawn light',
    sections: [
      '{Please, please slow down. Be still and wait for the Spirit of the Lord. Please slow down and hear His voice and know that He is God.}',
      'From the earliest history of the Restoration comes a principle one of the early Saints recalled learning from the Prophet Joseph Smith. Truman G. Madsen later summarized this principle: “If a man has a bow and keeps it constantly strung tight, it will soon lose its spring. The bow must be unstrung.”',
      'Are you constantly strung tight? If so, you will soon lose your spring. You must be occasionally unstrung!',
      'We need goals, we need plans. They keep us focused on things that really matter. They have a place. But is it right that they consume us and that we apply that kind of focus and pressure to every element of our lives?',
      '{Can we be at peace just being peaceful?}'
    ]
  }
];
