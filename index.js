const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const cmdArgs = require("command-line-args");

const formatAsTeX = (str) => {
  const inner = str.join(",");
  return "{" + inner + "}";
}

const genTeXBody = (from, to) => {
  const body =
`\\documentclass[nenga]{hagaki}
\\sender{
  postal_code = ${from.postalCode},
  name        = ${formatAsTeX(from.name)},
  address     = ${from.address}
}
\\begin{document}
\\recipient{
  postal_code = ${to.postalCode},
  name        = ${formatAsTeX(to.name)},
  address     = ${to.address}
}
\\end{document}`;
  return body;
};

const optsDef = [
  {
    name: "file",
    alias: "f"
  }
]
const opts = cmdArgs(optsDef);

const jsonData = fs.readFileSync(opts.file, "utf-8");
const { sender, recipient } = JSON.parse(jsonData);

const outputDir = path.resolve("output/");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

recipient.forEach(to => {
  const fileName = to.name;
  const body = genTeXBody(sender, to);
  fs.writeFile(outputDir + "/" + fileName + ".tex", body, (error) => {
    if (error) {
      throw error;
    } else {
      console.log("  >> Generated file: " + fileName + ".tex");
      const command = `lualatex "${fileName}.tex"`;
      const opts = {
        cwd: outputDir
      };
      cp.exec(command, opts, (error, stdout) => {
        if (error) {
          throw error;
        } else {
          console.log("  >> Generated file: " + fileName + ".pdf");
        }
      });
    }
  });
});