# Exam 1 results

Open `/stat-121/exam-1/` on the site. A static page with no build step: `exam.js` reads `data.json` and draws the charts as SVG.

`data.json` holds only aggregate counts and summary statistics. Regenerate it from a gradebook export with:

```bash
python3 stat-121/exam-1/aggregate.py path/to/gradebook.csv > stat-121/exam-1/data.json
```

Never commit the gradebook export itself; it has Net IDs and individual scores. A score marked `:dropped` was not kept, so each student's kept grade is the one score not marked dropped. A version counts as taken when its score is above 0. The page carries `noindex` and is left out of the sitemap.
