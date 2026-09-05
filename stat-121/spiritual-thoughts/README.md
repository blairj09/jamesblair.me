# Spiritual Thoughts

The student-facing collection is rendered from `thoughts.js`. To publish a new devotional, add an object to the **beginning** of the `spiritualThoughts` list:

```js
{
  date: '2026-09-04',
  reference: 'Mosiah 2:17',
  sourceUrl: 'https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/2?lang=eng&id=p17#p17',
  image: 'images/your-watercolor-image.png',
  imageAlt: 'Brief, descriptive alternative text for the image',
  sections: [
    'First paragraph.',
    '{An explicitly designated quote, wherever it belongs.}',
    'The next paragraph.'
  ],
  note: 'Optional class connection or reflection.'
}
```

Only `reference` is required. Students can search references, section text, and notes. Thoughts display newest first based on `date`. The student-facing page shows only thoughts dated today or earlier in Mountain Time. Use [`/stat-121/spiritual-thoughts-all/`](/stat-121/spiritual-thoughts-all/) to review every planned thought; it is not linked publicly or included in search indexing. Add image files to `images/` and reference them with a relative path. Wrap any author-selected quote in curly braces (for example, `{be still}`); it will use quote formatting at that exact position. To request italics, wrap only the desired text in single asterisks (for example, `*be still*`). To request bold text with a slight size increase, wrap it in double asterisks (for example, `**take heart**`). Preserve user-provided links with `[label](https://...)`. No emphasis or links are added otherwise.
