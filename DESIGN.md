# James Blair — Bold

The approved Bold mockup is the reference for this refresh. This is a personal portfolio about useful product work, speaking, teaching, and life in Utah.

- Archivo, with large, closely spaced headings and readable body copy.
- Citron (#e8ed62) carries the homepage and directory introductions. Charcoal text, off-white ground, olive secondary ink, and a small rust accent do the rest.
- Sharp edges, thin rules, and rows of work instead of a grid of cards. Real photographs carry the personal story.
- The homepage leads with “Less friction. Better work.” and the speaking photo. Work, a project portfolio with real website previews, biography, life, direct contact, and the optional AI guide follow.
- The AI guide is a native disclosure below direct contact. It keeps the existing API and session behavior.
- The homepage, Projects, and STAT 121 directory share the same shell. Classroom pages inherit the typography and palette without changing app controls, course material, or chart series colors.
- Dark mode retains citron and adapts neutral surfaces. Persist the explicit choice and otherwise follow the system. Classroom apps with no theme control keep their light teaching surface; the intro deck uses dark olive for projection.
- On mobile, navigation becomes a button-controlled list, columns stack, and headings scale to the screen. Without JavaScript, links remain visible.
- Use native links, labeled controls, visible keyboard focus, and reduced-motion support.

Shared color tokens live in `css/tokens.css`. The five site CSS modules concatenate into `style.css` with `npm run build`. Classroom integration lives in `css/classroom.css` and loads after each app stylesheet.

Projects combines standalone websites and small tools in one directory at `/projects/`, with simple Website and Tool labels. The homepage features selected projects and links to the full collection. `/tools/` redirects to the directory; existing `/tools/<app>/` URLs remain unchanged.
