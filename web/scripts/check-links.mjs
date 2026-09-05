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

let broken = 0;
for (const file of htmls) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].endsWith("/") ? join(OUT, m[1], "index.html") : join(OUT, m[1]);
    const alt = join(OUT, m[1] + ".html");
    if (!existsSync(target) && !existsSync(alt) && !existsSync(join(OUT, m[1]))) {
      console.error(`BROKEN ${m[1]}  (in ${file})`);
      broken++;
    }
  }
}
process.exit(broken ? 1 : 0);
