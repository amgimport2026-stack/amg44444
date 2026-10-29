const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "build");
const files = ["index.html", "styles.css", "app.js", "config.js"];
const directories = ["assets"];

fs.mkdirSync(output, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

for (const directory of directories) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), {
    recursive: true,
    force: true,
  });
}

console.log(`Static build ready: ${output}`);
