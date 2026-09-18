---
name: add-stat-121-spiritual-thought
description: "Publish a supplied STAT 121 devotional as a searchable spiritual thought with title, optional author, source attribution, and three AI-generated abstract watercolor candidates for user selection. Use when the user provides thought text and a source or scripture reference for the STAT 121 site."
---

# Add Stat 121 Spiritual Thought

Publish the user's supplied devotional at `/stat-121/spiritual-thoughts/` without changing other thoughts.

## Inputs and scope

Gather the date, thought text, title, optional author, source label, and source URL from the user’s request. Preserve the supplied wording and paragraphs; do not invent or expand religious content. If the user supplies a title or author, use it. Otherwise, infer the missing title and author from the source page’s metadata or visible heading/byline. Infer a specific source label from the link when possible: use `General Conference` for Church General Conference talks, not the generic Church publisher name. Leave `author` out for scriptures and sources without a named speaker or author. If an essential detail cannot be established, use the clearest available information and ask only when the missing detail would make the entry misleading.

Treat a user-provided source URL as attribution. You may retrieve only the page metadata or visible title/byline needed to identify the title and author; do not retrieve or reproduce additional source material unless the user asks for research.

## Add the thought

First inspect `stat-121/spiritual-thoughts/thoughts.js` and `thoughts-page.js` so the entry matches the current data model. Add the new object at the beginning of `spiritualThoughts`; the page sorts entries by date, newest first.

Thoughts dated after today in Mountain Time are held back from the student-facing page until their date. Review all scheduled thoughts at `/stat-121/spiritual-thoughts-all/`; that route is a convenience view, not access control.

Use these fields when relevant:

```js
{
  date: 'YYYY-MM-DD',
  title: 'Title or scripture reference',
  author: 'Optional named speaker or author',
  sourceUrl: 'https://…',
  sourceLabel: 'Specific source type, such as General Conference, Book of Mormon, or BYU devotional',
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

`title` is displayed as the card heading and the reader’s source link. `author`, when present, is displayed beneath the title and is included in search. Do not combine the author and title into one field.

Only add text emphasis when the user marks it in their supplied text. Preserve `*single-asterisk markers*` in `thoughts.js`; the page renders them as italics. Preserve `**double-asterisk markers**`; the page renders them bold with a slight size increase. Do not add italics, bolding, or other emphasis on your own.

Preserve user-supplied Markdown links (`[label](https://...)`) in `thoughts.js`; the page renders them as safe external links. Do not add links the user did not supply.

When updating an existing thought, change only the requested fields. Retain its `image` and `imageAlt` unless the user explicitly asks to create, replace, or revise the image. Do not invoke image generation for a text-only update. For legacy entries, migrate a combined reference into separate `title` and optional `author` fields when the user requests title/author support.

## Create and select an image

Use the `imagegen` skill and its built-in generation tool to create three candidate images. The visual direction should match the current collection: an abstract watercolor painting that reflects the thought’s mood and theme, with no text, watermark, people, or religious symbols unless the user specifically asks for them.

Make each prompt specific to the supplied thought, while retaining a calm, contemplative, student-facing watercolor quality. Before prompting, review the existing image descriptions and deliberately choose three visual metaphors that differ from recent entries in at least two dimensions: subject, composition, palette, or paint treatment. The three candidates must also differ materially from one another in at least two of those dimensions. Do not default to a luminous sunrise over distant mountains and water. Use that motif only when it is uniquely apt and clearly differentiated from the collection.

Vary the collection through choices such as close-cropped botanical forms, woven or branching abstractions, architectural light and shadow, still-life arrangements, aerial patterns, paper-like collage layers, restrained ink-and-wash marks, or a distinctly cool, earthy, or jewel-toned palette. Use a landscape, portrait, or nearly square composition only when it suits the thought and creates a new visual rhythm in the collection. Avoid literal illustrations of the devotional’s wording.

Inspect and show all three candidates inline, clearly labeled 1–3 along with their prompts. Then stop and ask the user which candidate to use. Do not copy a candidate into `stat-121/spiritual-thoughts/images/`, reference it in `thoughts.js`, or complete verification until the user selects one. After selection, copy only the chosen image into `stat-121/spiritual-thoughts/images/` with a descriptive, date-prefixed filename and reference it with a relative `images/` path in `thoughts.js`.

## Verify

Run JavaScript syntax checks for the changed thought data and page script, then run `npm run build` and `git diff --check`. Start or reuse a local static server and verify that the new card renders, opens its full-screen reader on click, shows the image, title, author when present, and source link, and appears in search results. Search by author when the thought has one. When checking the reader, use a projector-like wide viewport and confirm the thought fills the slide without unnecessary whitespace or scrolling.

Report the public route, title and author used or inferred, selected workspace image path, source attribution, and all three image-generation prompts.
