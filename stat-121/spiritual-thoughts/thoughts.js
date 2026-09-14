/*
 * Add a new devotional by adding an object to the beginning of this list.
 * `title` is required. `author`, `sections`, `note`, `image`, `sourceUrl`,
 * and `sourceLabel` are optional. Use ordered string sections to preserve
 * paragraph order. Wrap a user-designated quote in {curly braces}; wrap
 * user-requested italic text in *single asterisks*.
 * Dates use YYYY-MM-DD so the newest thoughts sort correctly.
 */
const spiritualThoughts = [
  {
    date: '2026-09-15',
    title: 'Alive in Christ',
    author: 'Dallin H. Oaks',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/general-conference/2026/04/49oaks?lang=eng',
    sourceLabel: 'General Conference',
    image: 'images/2026-09-14-peacemaking-watercolor.png?v=20260914-variety',
    imageAlt: 'Abstract watercolor close-up of magnolia blossoms and teal leaves with gold ink details',
    sections: [
      'The Prophet Joseph Smith taught that we should “pour forth love” to all people. Speaking of our Savior, the Apostle John wrote, “We love him, because he first loved us”. We can follow the example of Jesus Christ, who is our role model, by choosing to love others—even if they show little or no love toward us. He declared, {Blessed are the peacemakers: for they shall be called the children of God}'
    ]
  },
  {
    date: '2026-09-10',
    title: '2 Nephi 2:26',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/2?lang=eng#:~:text=26%20And%20the,God%20hath%20given.',
    sourceLabel: 'Book of Mormon',
    image: 'images/2026-09-10-agency-watercolor.png?v=20260914-variety',
    imageAlt: 'Abstract watercolor aerial map of branching paths and decision points',
    sections: [
      'And the Messiah cometh in the fulness of time, that he may redeem the children of men from the fall. And because that they are redeemed from the fall they have become free forever, knowing good from evil; {to act for themselves and not to be acted upon}, save it be by the punishment of the law at the great and last day, according to the commandments which God hath given.'
    ]
  },
  {
    date: '2026-09-08',
    title: 'Peace and Rest—Even Now',
    author: 'Patrick Kearon',
    sourceUrl: 'https://speeches.byu.edu/talks/patrick-kearon/peace-and-rest-even-now/',
    sourceLabel: 'BYU devotional',
    image: 'images/peace-and-rest-watercolor.png?v=20260914-variety',
    imageAlt: 'Abstract watercolor still life of an unstrung bow, folded linen, and a smooth stone',
    sections: [
      '{Please, please slow down. Be still and wait for the Spirit of the Lord. Please slow down and hear His voice and know that He is God.}',
      'From the earliest history of the Restoration comes a principle one of the early Saints recalled learning from the Prophet Joseph Smith. Truman G. Madsen later summarized this principle: “If a man has a bow and keeps it constantly strung tight, it will soon lose its spring. The bow must be unstrung.”',
      'Are you constantly strung tight? If so, you will soon lose your spring. You must be occasionally unstrung!',
      'We need goals, we need plans. They keep us focused on things that really matter. They have a place. But is it right that they consume us and that we apply that kind of focus and pressure to every element of our lives?',
      '{Can we be at peace just being peaceful?}'
    ]
  }
];
