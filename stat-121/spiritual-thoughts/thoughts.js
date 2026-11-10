/*
 * Add a new devotional by adding an object to the beginning of this list.
 * `title` is required. `author`, `sections`, `note`, `image`, `sourceUrl`,
 * and `sourceLabel` are optional. Use ordered string sections to preserve
 * paragraph order. Wrap a user-designated quote in {curly braces}; wrap
 * user-requested italic text in *single asterisks*.
 * For multiple sources, use `passages`: objects with `title`, `sourceUrl`,
 * `sourceLabel`, and ordered string `sections`. Newlines preserve verse lines.
 * For a YouTube clip, use `video`: an `id` plus `start` and `end` in seconds.
 * Dates use YYYY-MM-DD so the newest thoughts sort correctly.
 */
const spiritualThoughts = [
  {
    date: '2026-11-10',
    title: 'The Inconvenient Messiah',
    author: 'Jeffrey R. Holland',
    sourceUrl: 'https://speeches.byu.edu/talks/jeffrey-r-holland/inconvenient-messiah/',
    sourceLabel: 'BYU devotional',
    image: 'images/2026-11-10-take-heart-race-podium.jpeg',
    imageAlt: 'Cyclists celebrating on a race podium, with the first-place finisher holding a child',
    sections: [
      'If for a while the harder you try, the harder it gets, {take heart}. So it has been with the best people who ever lived.'
    ]
  },
  {
    date: '2026-11-03',
    image: 'images/2026-11-03-forward-together-watercolor.png',
    imageAlt: 'Gold and terracotta watercolor ribbons flowing forward together across ivory paper',
    title: '“Remember Lot’s Wife”',
    author: 'Jeffrey R. Holland',
    sourceUrl: 'https://speeches.byu.edu/talks/jeffrey-r-holland/remember-lots-wife/',
    sourceLabel: 'BYU devotional',
    sections: [
          "I remember one fall day—I think it was in the first semester after our marriage in 1963—we were walking together up the hill past the Maeser Building on the sidewalk that led between the President’s Home and the Brimhall Building. Somewhere on that path we stopped and wondered what we had gotten ourselves into. Life that day seemed so overwhelming, and the undergraduate plus graduate years that we still anticipated before us seemed monumental, nearly insurmountable. Our love for each other and our commitment to the gospel were strong, but most of all the other temporal things around us seemed particularly ominous.",
          "On a spot that I could probably still mark for you today, I turned to Pat and said something like this: “Honey, should we give up? I can get a good job and carve out a good living for us. I can do some things. I’ll be okay without a degree. Should we stop trying to tackle what right now seems so difficult to face?”",
          "In my best reenactment of Lot’s wife, I said, in effect, “Let’s go back. Let’s go home. The future holds nothing for us.”",
          "Then my beloved little bride did what she has done for 45 years since then. She grabbed me by the lapels and said, “We are not going back. We are not going home. The future holds *everything* for us.”",
          "She stood there in the sunlight that day and gave me a real talk. I don’t recall that she quoted Paul, but there was certainly plenty in her voice that said she was committed to setting aside all that was past in order to “press toward the mark” and seize the prize of God that lay yet ahead. It was a living demonstration of faith. It was “the substance of things hoped for, the evidence of things not seen” ([Hebrews 11:1](https://www.churchofjesuschrist.org/scriptures/nt/heb/11.1?lang=eng)). So we laughed, kept walking, and finished up sharing a root beer—one glass, two straws—at the then newly constructed Wilkinson Center.",
          "Twenty years later I would, on occasion, look out of the window of the President’s Home across the street from the Brimhall Building and picture there on the sidewalk two newlywed BYU students, down on their money and down even more on their confidence. And as I would gaze out that window, usually at night, I would occasionally see not Pat and Jeff Holland but you and you and you, walking that same sidewalk. I would see you sometimes as couples, sometimes as a group of friends, sometimes as just a lone student. I knew something of what you were feeling. Some of you were having thoughts such as these: Is there any future for me? What does a new year or a new semester or a new major or a new romance hold for me? Will I be safe? Will life be sound? Can I trust in the Lord and in the future? Or would it be better to look back, to go back, to go home?",
          "To all such of every generation, I call out, “Remember Lot’s wife.” Faith is for the future. Faith builds on the past but never longs to stay there. Faith trusts that God has great things in store for each of us and that Christ truly is the “high priest of good things to come” (Hebrews 9:11)."
    ],
    video: {
      id: 'obNlH5VZ_qg',
      start: 1607,
      end: 1985
    }
  },
  {
    date: '2026-10-29',
    title: 'Alma 37:6',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/37?lang=eng&id=p6#p6',
    sourceLabel: 'Book of Mormon',
    image: 'images/2026-10-29-small-marks-watercolor.png',
    imageAlt: 'Abstract watercolor of tiny plum, slate-blue, and copper marks gathering into a broad sweeping arc on ivory paper',
    sections: [
      'Now ye may suppose that this is foolishness in me; but behold I say unto you, that {by small and simple things are great things brought to pass}; and small means in many instances doth confound the wise.'
    ]
  },
  {
    date: '2026-10-27',
    title: 'Trusting God With the Rest of Your Story',
    author: 'Morgan Jones Pearson',
    sourceUrl: 'https://speeches.byuh.edu/trusting-god-with-the-rest-of-your-story',
    sourceLabel: 'BYU–Hawaii devotional',
    image: 'images/2026-10-27-middle-of-infinity-watercolor.png',
    imageAlt: 'Watercolor of a small blue planet suspended between vast rose and blue clouds of stardust',
    sections: [
      'I invite you to remember that as long as we are here on earth, {we are always in the middle of our story} but as we allow the Lord to co-author that story with us, the rest of the story will become more beautiful than we could’ve ever dreamed.'
    ]
  },
  {
    date: '2026-10-20',
    title: 'Philippians 4:4',
    sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/nt/philip/4?lang=eng&id=p4#p4',
    sourceLabel: 'New Testament',
    image: 'images/2026-10-20-rejoice-autumn-aspens-watercolor.png',
    imageAlt: 'Watercolor mountain sunrise framed by white aspen trunks and golden autumn leaves',
    sections: [
      'Rejoice in the Lord alway: and again I say, Rejoice.'
    ]
  },
  {
    date: '2026-10-15',
    title: 'Coming Closer to Jesus Christ',
    author: 'Dallin H. Oaks',
    sourceUrl: 'https://speeches.byu.edu/talks/dallin-h-oaks/coming-closer-to-jesus-christ/',
    sourceLabel: 'BYU devotional',
    image: 'images/2026-10-15-closer-to-christ-passage-watercolor.png',
    imageAlt: 'Watercolor architectural passage in ultramarine and terracotta opening toward soft peach light',
    sections: [
      'One of the many reasons you will need the constant influence of the Holy Ghost is that you live in a season in which the adversary has become so effective at disguising truth that if you don’t have the Holy Ghost, {you will be deceived.}',
      '...I want to help all our members overcome present or future doubts. Whatever those doubts, the way to overcome them is to get closer to our Savior Jesus Christ. Again and again, He has taught us that {He is the way}.'
    ]
  },
  {
    date: '2026-10-13',
    title: 'Why Everyone Should Be Religious',
    author: 'Ross G. Douthat',
    sourceUrl: 'https://speeches.byu.edu/talks/ross-g-douthat/why-everyone-should-be-religious/',
    sourceLabel: 'BYU forum',
    image: 'images/2026-10-13-earth-horizon-watercolor.png',
    imageAlt: 'Watercolor of Earth’s turquoise curved horizon beneath lavender and rose-colored space',
    sections: [
      'Come what may, {we are meant to be here}. We are meant to exist. We are meant to find fulfillment and understand our place in the universe. We are meant to be part of a real story that has a real purpose and, God willing, a happy ending.'
    ]
  },
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
