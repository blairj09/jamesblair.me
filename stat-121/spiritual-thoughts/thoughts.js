/*
 * Add a new devotional by adding an object to the beginning of this list.
 * `title` is required. `author`, `sections`, `note`, `image`, `sourceUrl`,
 * and `sourceLabel` are optional. Use ordered string sections to preserve
 * paragraph order. Wrap a user-designated quote in {curly braces}; wrap
 * user-requested italic text in *single asterisks*.
 * For multiple sources, use `passages`: objects with `title`, `sourceUrl`,
 * `sourceLabel`, and ordered string `sections`. Newlines preserve verse lines.
 * Dates use YYYY-MM-DD so the newest thoughts sort correctly.
 */
const spiritualThoughts = [
  {
    date: '2026-10-08',
    title: 'Isaiah 53:4–5',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/ot/isa/53?lang=eng&id=p4-p5#p4',
    sourceLabel: 'Old Testament',
    image: 'images/2026-10-08-quiet-healing-watercolor.png',
    imageAlt: 'Abstract watercolor of charcoal and forest-green fragments softening into pale celadon and pearl-white washes',
    sections: [
      '{Surely he hath borne our griefs, and carried our sorrows}: yet we did esteem him stricken, smitten of God, and afflicted.',
      'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.'
    ]
  },
  {
    date: '2026-10-06',
    title: 'The Sculpting of Our Souls',
    author: 'Tamara W. Runia',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/general-conference/2026/10/13runia?lang=eng',
    sourceLabel: 'General Conference',
    image: 'images/2026-10-06-red-umbrella-foundation-watercolor.png',
    imageAlt: 'Watercolor of an open red umbrella above a stacked stone foundation in lavender-gray rain',
    sections: [
      'So the gospel felt like a big umbrella I could hold over my head to keep the rain from falling on me. But I’ve learned from experience that we’re all going to get rained on. And sometimes we’re going to get pelted!',
      '{The gospel isn’t the umbrella; it’s the solid rock we’re standing on during the storm}—that “sure foundation … whereon if men build they cannot fall.”'
    ]
  },
  {
    date: '2026-10-01',
    title: 'Alma 5:26 & Come, Listen to a Prophet’s Voice',
    image: 'images/2026-10-01-joyful-music-watercolor.png',
    imageAlt: 'Watercolor string instrument in warm amber with flowing gold and violet washes',
    passages: [
      {
        title: 'Alma 5:26',
        sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/5?lang=eng&id=p26#p26',
        sourceLabel: 'Book of Mormon',
        sections: [
          'And now behold, I say unto you, my brethren, if ye have experienced a change of heart, and if ye have felt to {sing the song of redeeming love}, I would ask, can ye feel so now?'
        ]
      },
      {
        title: 'Come, Listen to a Prophet’s Voice',
        revealOnClick: true,
        sourceUrl: 'https://www.churchofjesuschrist.org/media/music/songs/come-listen-to-a-prophets-voice?lang=eng',
        sourceLabel: 'Hymn',
        sections: [
          'Come, listen to a prophet’s voice,\nAnd hear the word of God,\nAnd in the way of truth rejoice,\n{And sing for joy aloud.}'
        ]
      }
    ]
  },
  {
    date: '2026-09-24',
    title: '2 Nephi 2:25',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/2?lang=eng&id=p25#p25',
    sourceLabel: 'Book of Mormon',
    image: 'images/2026-09-24-dawning-joy-watercolor.png',
    imageAlt: 'Watercolor sunrise shining through a canopy of green leaves',
    sections: [
      'Adam fell that men might be; and {men are, that they might have joy}.'
    ]
  },
  {
    date: '2026-09-29',
    title: 'To Those Enduring Trials with No End',
    author: 'Jeffrey S. Bednar',
    sourceUrl: 'https://speeches.byu.edu/talks/jeffrey-s-bednar/to-those-enduring-trials-with-no-end/',
    sourceLabel: 'BYU devotional',
    image: 'images/2026-09-24-enduring-faith-watercolor.png',
    imageAlt: 'Abstract watercolor close-up of smooth river rocks beneath gentle flowing water',
    sections: [
      '...my dear students, as you encounter storms in life, always remember that trials with no mortal end do have an end. As you endure to that end, you are growing from little faith to greater faith and partnering with the Savior to build {an enduring soul that will never fail}. With your little faith and His magnifying power, “nothing shall be impossible” to you, even becoming like Him.',
      'I leave that testimony with you in the name of Him whom we call {the beginning and *the end*}, the ultimate example of One who endured all things—even Jesus Christ, amen.'
    ]
  },
  {
    date: '2026-09-22',
    title: 'Isaiah 1:18',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/ot/isa/1?lang=eng&id=p18#p18',
    sourceLabel: 'Old Testament',
    image: 'images/2026-09-22-scarlet-to-white-watercolor.png',
    imageAlt: 'Abstract watercolor of crimson pigment diffusing across handmade white paper fibers',
    sections: [
      'Come now, and let us reason together, saith the Lord: {though your sins be as scarlet, they shall be as white as snow;} though they be red like crimson, they shall be as wool.'
    ]
  },
  {
    date: '2026-09-17',
    title: 'In Appreciation of Friction: Embracing the Awkward',
    author: 'C. Shane Reese',
    sourceUrl: 'https://speeches.byu.edu/talks/c-shane-reese/in-appreciation-of-friction-embracing-the-awkward/',
    sourceLabel: 'BYU devotional',
    image: 'images/2026-09-17-becoming-watercolor.png',
    imageAlt: 'Abstract watercolor still life of a repaired earthenware vessel on a pottery worktable',
    sections: [
      'Nobody masters anything by staying within the safety of what they already know. {There must be productive struggle and frequent failure.} So don’t be embarrassed by the stumbles. Champion them. They are badges of becoming.'
    ]
  },
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
    image: 'images/peace-and-rest-watercolor.png?v=20260914-restored',
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
