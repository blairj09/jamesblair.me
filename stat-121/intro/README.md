# Semester introduction deck

Open `index.html` in any modern browser, or visit `/stat-121/intro/` when the site is running. It has no build step, external dependency, or network requirement; it is intended to work from a local file or static host.

## Customize for a class

Edit the `INTRO_CONFIG` object at the top of `deck.js`. It contains the course name, term, meeting information, room, office hours, and course-resources link. Those values are used throughout the slides.

The nine slides are deliberately concise: welcome, path, current work, teaching philosophy, family, life beyond work, fun facts, class norms, and questions. Edit their HTML in `index.html` if a course needs more specific material. The deck-specific family, outdoor, and fun-facts slides use the photos in `images/intro-*.jpg`.

## Present

Use the on-screen buttons, left/right arrows, Space, Page Up/Down, Home, and End. The current slide is also encoded in the URL (for example, `#teach`), so any slide can be bookmarked or shared. Swipe left/right works on touch displays. The layout scales to the browser viewport and honors reduced-motion preferences.

For an in-class presentation, open the deck in a browser at `/stat-121/intro/` and use the browser’s normal full-screen mode if desired. The deck and every image it uses live in this directory, so it can be copied as a self-contained course asset.
