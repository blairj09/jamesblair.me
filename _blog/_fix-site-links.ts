// Also lifts the site header and footer out of Quarto's content column so they
// span the page like the rest of jamesblair.me.
//
// Quarto treats links that start with "/" as relative to this project, which
// would point /style.css at /blog/style.css. Site-wide links in the partials are
// written as "@site/..." instead, and this post-render step turns them back into
// root-relative URLs.
const outputDirName = Deno.env.get("QUARTO_PROJECT_OUTPUT_DIR") ?? "_site";
const outputDir = new URL(`file://${outputDirName.startsWith("/") ? outputDirName : `${Deno.cwd()}/${outputDirName}`}/`);
const outputFiles = Deno.env.get("QUARTO_PROJECT_OUTPUT_FILES")?.split("\n") ?? [];

async function* htmlFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    const url = new URL(entry.name + (entry.isDirectory ? "/" : ""), dir);
    if (entry.isDirectory && entry.name !== "site_libs") yield* htmlFiles(url);
    else if (entry.name.endsWith(".html")) yield url;
  }
}

const files = outputFiles.length ? outputFiles.filter((f) => f.endsWith(".html")) : [];
const targets: (string | URL)[] = files.length ? files : [];
if (!targets.length) for await (const f of htmlFiles(outputDir)) targets.push(f);

for (const file of targets) {
  const text = await Deno.readTextFile(file);
  let fixed = text.replace(/((?:href|src|content)=")(?:\.\.?\/)*@site\//g, "$1/");
  const header = fixed.match(/<a class="skip-link"[\s\S]*?<header class="header site-header">[\s\S]*?<\/header>\n?/)?.[0];
  if (header) fixed = fixed.replace(header, "").replace(/(<body[^>]*>)/, `$1\n${header}`);
  const footer = fixed.match(/<footer class="footer container site-footer">[\s\S]*?<\/footer>\n?/)?.[0];
  if (footer) fixed = fixed.replace(footer, "").replace(/(<\/body>)/, `${footer}$1`);
  if (fixed !== text) await Deno.writeTextFile(file, fixed);
}
