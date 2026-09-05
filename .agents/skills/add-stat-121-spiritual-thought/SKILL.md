---
name: add-stat-121-spiritual-thought
description: "Publish a supplied STAT 121 devotional as a searchable spiritual thought with a matching AI-generated abstract watercolor image. Use when the user provides thought text and a source or scripture reference for the STAT 121 site."
---

# Add Stat 121 Spiritual Thought

Publish the user's supplied devotional at `/stat-121/spiritual-thoughts/` without changing other thoughts.

## Inputs and scope

Gather the date, thought text, reference or title, and source URL from the user’s request. Preserve the supplied wording and paragraphs; do not invent or expand religious content. If any of those essential details are missing, use the clearest available information and ask only when the missing detail would make the entry misleading.

Treat a user-provided source URL as attribution. Do not retrieve or reproduce more source material than the user supplied unless they ask for research.

## Add the thought

First inspect `stat-121/spiritual-thoughts/thoughts.js` and `thoughts-page.js` so the entry matches the current data model. Add the new object at the beginning of `spiritualThoughts`; the page sorts entries by date, newest first.

Thoughts dated after today in Mountain Time are held back from the student-facing page until their date. Review all scheduled thoughts at `/stat-121/spiritual-thoughts-all/`; that route is a convenience view, not access control.

Use these fields when relevant:

```js
{
  date: 'YYYY-MM-DD',
  reference: 'Author, “Title” or scripture reference',
  sourceUrl: 'https://…',
  image: 'images/YYYY-MM-DD-short-theme-watercolor.png',
  imageAlt: 'Concise description of the image',
  sections: [
    'First paragraph.',
    '{A passage the user explicitly selected as a quote.}',
    'The next paragraph.'
  ],
  note: 'Optional short class connection.'
}
```

Use ordered string `sections` to preserve the supplied thought exactly. Curly braces around any passage (`{like this}`) render it with quote formatting at that exact position. Do not add curly braces or choose a quote automatically, and do not add tags to thoughts.

Only add text emphasis when the user marks it in their supplied text. Preserve `*single-asterisk markers*` in `thoughts.js`; the page renders them as italics. Preserve `**double-asterisk markers**`; the page renders them bold with a slight size increase. Do not add italics, bolding, or other emphasis on your own.

Preserve user-supplied Markdown links (`[label](https://...)`) in `thoughts.js`; the page renders them as safe external links. Do not add links the user did not supply.

When updating an existing thought, change only the requested fields. Retain its `image` and `imageAlt` unless the user explicitly asks to create, replace, or revise the image. Do not invoke image generation for a text-only update.

## Create the image

Use the `imagegen` skill and its built-in generation tool to create one project-bound image. The visual direction should match the current collection: an abstract watercolor painting that reflects the thought’s mood and theme, with no text, watermark, people, or religious symbols unless the user specifically asks for them.

Make the prompt specific to the supplied thought, while normally retaining a calm, contemplative, student-facing quality. Use a landscape or portrait composition that suits the thought; avoid literal illustrations of the devotional’s wording. Inspect the result before use. Copy the selected image into `stat-121/spiritual-thoughts/images/` with a descriptive, date-prefixed filename and reference it with a relative `images/` path in `thoughts.js`.

## Verify

Run JavaScript syntax checks for the changed thought data and page script, then run `npm run build` and `git diff --check`. Start or reuse a local static server and verify that the new card renders, opens its full-screen reader on click, shows the image and source link, and appears in search results. When checking the reader, use a projector-like wide viewport and confirm the thought fills the slide without unnecessary whitespace or scrolling.

Report the public route, the workspace image path, source attribution, and the image-generation prompt used.
