import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const OUT = "out";
const htmls = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p) : extname(p) === ".html" && htmls.push(p);
  }
})(OUT);

// A path only genuinely "resolves" if it's a real file, or a directory that
// itself contains an index.html (mirroring how a static host serves a
// directory request). A directory with no index.html — e.g. a stale/empty
// folder left in `out/` — must NOT count as resolved, even though
// existsSync() alone would say it does.
const resolves = (p) => {
  if (!existsSync(p)) return false;
  const st = statSync(p);
  return st.isFile() || (st.isDirectory() && existsSync(join(p, "index.html")));
};

let broken = 0;
for (const file of htmls) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].endsWith("/") ? join(OUT, m[1], "index.html") : join(OUT, m[1]);
    const alt = join(OUT, m[1] + ".html");
    const bare = join(OUT, m[1]);
    if (!resolves(target) && !resolves(alt) && !resolves(bare)) {
      console.error(`BROKEN ${m[1]}  (in ${file})`);
      broken++;
    }
  }
}
process.exit(broken ? 1 : 0);
