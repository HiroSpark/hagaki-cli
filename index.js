const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const dataFilePath = "data.json";
const jsonData = fs.readFileSync(dataFilePath, "utf-8");
const { sender, recipient } = JSON.parse(jsonData);

const genTeXBody = (from, to) => {
  const body =
`\\documentclass{hagaki}
\\sender{
  postal_code = ${from.postalCode},
  name        = ${from.name},
  address     = ${from.address}
}
\\begin{document}
\\recipient{
  postal_code = ${to.postalCode},
  name        = ${to.name},
  address     = ${to.address}
}
\\end{document}`;
  return body
}

const outputDir = path.resolve("output/");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

recipient.forEach(to => {
  const fileName = to.name;
  const body = genTeXBody(sender, to);
  fs.writeFile(outputDir + "/" + fileName + ".tex", body, (error) => {
    if (error) {
      throw error
    } else {
      console.log("  >> Generated file: " + fileName + ".tex");
      const command = `lualatex "${fileName}.tex"`;
      const opts = {
        cwd: outputDir,
        timeout: 5000
      }
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