const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const cmdArgs = require("command-line-args");

// オプション

const optsDef = [
  {
    name: "filter",
    defaultOption: true
  },
  {
    name: "file",
    alias: "f",
    defaultValue: "data.json"
  }
]
const opts = cmdArgs(optsDef);

// JSON の読み込み

const jsonData = fs.readFileSync(opts.file, "utf-8");
const { sender, recipient } = JSON.parse(jsonData);

// 主処理

const getAllMembers = (name, family) => [name, ... family ? family : []];
const formatAsEntry = (array) => {
  return "{" + array.join(",") + "}";
};

const outputDir = path.resolve("output/");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const senderMembers = getAllMembers(sender.name, sender.family);
const filterRegex = new RegExp(opts.filter);

Object.keys(recipient).forEach((recipienetName) => {
  if (filterRegex.test(recipienetName)) {
    const recipientData = recipient[recipienetName];
    const recipientMembers = getAllMembers(recipienetName, recipientData.family);
    const texFileBody = 
`\\documentclass[nenga]{hagaki}
\\sender{
  postal_code = ${sender.postalCode},
  name        = ${formatAsEntry(senderMembers)},
  address     = ${sender.address}
}
\\begin{document}
\\recipient{
  postal_code = ${recipientData.postalCode},
  name        = ${formatAsEntry(recipientMembers)},
  address     = ${recipientData.address}
}
\\end{document}`;
    const fileName = recipienetName.replace(" ", "_");
    const texFilePath = path.format({ dir: outputDir, name: fileName, ext: ".tex" });
    fs.promises.writeFile(texFilePath, texFileBody)
      .then(() => {
        console.log("  >> Generated file: " + fileName + ".tex");
        const command = "lualatex " + fileName + ".tex";
        const opts = {
          cwd: outputDir
        }
        cp.exec(command, opts, (error) => {
          if (error) {
            throw error;
          } else {
            console.log("  >> Generated file: " + fileName + ".pdf");
          }
        });
      })
      .catch((error) => {
        throw error;
      });
  }
});