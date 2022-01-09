const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const cmdArgs = require("command-line-args");

// オプション

const optsDef = [
  {
    name: "filter",
    defaultOption: true,
    type: String
  },
  {
    name: "file",
    alias: "f",
    defaultValue: "data.json",
    type: String
  },
  {
    name: "tex-only",
    alias: "t",
    defaultValue: false,
    type: Boolean
  },
  {
    name: "pdf-only",
    alias: "p",
    defaultValue: false,
    type: Boolean
  },
  {
    name: "tex-options",
    alias: "o",
    multiple: true,
    type: String
  }
]
const opts = cmdArgs(optsDef, { camelCase: true });

// JSON の読み込み

const jsonData = fs.readFileSync(opts.file, "utf-8");
const { sender, recipient } = JSON.parse(jsonData);

// 主処理

const getAllMembers = (name, family) => [name, ... family ? family : []];
const formatAsEntry = (array) => {
  return "{" + array.join(",") + "}";
};

const texToPdf = (workDir, fileName) => {
  const command = "lualatex " + fileName + ".tex";
  const opts = {
    cwd: workDir
  }
  cp.exec(command, opts, (error) => {
    if (error) {
      throw error;
    } else {
      console.log("  >> Generated file: " + fileName + ".pdf");
    }
  });
}

const outputDir = path.resolve("output/");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const senderMembers = getAllMembers(sender.name, sender.family);
const filterRegex = new RegExp(opts.filter);

Object.keys(recipient).forEach((recipienetName) => {
  if (filterRegex.test(recipienetName)) {
    // ファイル名
    const fileName = recipienetName.replace(" ", "_");
    if (!opts.pdfOnly) {
      // tex ファイルの中身の作成
      const recipientData = recipient[recipienetName];
      const recipientMembers = getAllMembers(recipienetName, recipientData.family);
      const texFileBody = 
`\\documentclass[${opts.texOptions}]{hagaki}
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
      const texFilePath = path.format({ dir: outputDir, name: fileName, ext: ".tex" });
      // ファイルの作成
      fs.promises.writeFile(texFilePath, texFileBody)
        .then(() => {
          console.log("  >> Generated file: " + fileName + ".tex");
          if (!opts.texOnly) texToPdf(outputDir, fileName);
        })
        .catch((error) => {
          throw error;
        });
    } else {
      texToPdf(outputDir, fileName);
    }
  }
});