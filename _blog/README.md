# Thoughts (the blog)

Quarto project behind https://jamesblair.me/blog/. The site build renders it
into `/blog/`, so never edit files in `/blog/` directly (they are gitignored).

## Write a post

1. Make a folder named for the URL you want, with an `index.qmd` inside:
   `_blog/my-post-name/index.qmd` becomes `jamesblair.me/blog/my-post-name/`.
   Copying `starter-post/` is the quickest way to start.
2. Fill in the header:

   ```yaml
   ---
   title: "The title"
   description: "One sentence for the list, the RSS feed, and link previews."
   date: 2026-11-02
   categories: [cycling]     # optional
   image: cover.jpg          # optional share image, kept in the post folder
   draft: true               # remove when it's ready to go live
   ---
   ```

3. Write in Markdown. Images go in the post folder and are linked by file name.
4. Preview with `quarto preview _blog --profile preview` (or `npm run preview:blog`).
5. Commit and push. Drafts show on Vercel preview deploys but never on the live site.

## Posts with R or Python

Code chunks (`{r}`, `{python}`) run only on your machine. Before you push a post
that has them, run `quarto render _blog` locally and commit the updated
`_blog/_freeze/` folder along with the post. Vercel uses those saved results and
never runs R or Python itself. If you skip this, the Vercel build will fail
because it can't run the code.

Observable JS chunks (`{ojs}`) run in the reader's browser and need nothing extra.

## How it's wired up

- `npm run build` runs `scripts/build-blog.sh`, which downloads a pinned
  Quarto version on Vercel (cached in `node_modules/.cache`), renders this
  project, and copies `_site/` to `/blog/`.
- `_partials/` holds the site header, footer, and the post list template, so
  the blog shares the main site's nav and styles. `theme.scss` adapts Quarto's
  defaults to the site's colors and dark mode.
- `_fix-site-links.ts` runs after each render. Quarto treats links starting
  with `/` as relative to this folder, so the partials write site-wide links
  as `@site/...` and this script turns them back into `/...`. It also moves the
  header and footer outside Quarto's content column.
- The RSS feed is at `/blog/index.xml`.
