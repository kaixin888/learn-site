const { writeFileSync, mkdirSync } = require("fs");
const { join, dirname } = require("path");
const SRC = "C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/src";
const data = require("./files.json");
for (const [k, v] of Object.entries(data)) {
  const p = join(SRC, k);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, v, "utf8");
  console.log("OK:", k);
}
