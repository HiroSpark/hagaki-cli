#!/usr/bin/env node

import fs = require('fs');
import cp = require('child_process');
import path = require('path');
import cmdArgs = require('command-line-args');

import type { OptionDefinition } from 'command-line-args';

// オプション

const optsDef: Array<OptionDefinition> = [
  // --filter <正規表現>
  {
    name: 'filter',
    defaultOption: true,
    type: String,
  },
  // --file -f <住所のJSファイル>
  {
    name: 'file',
    alias: 'f',
    defaultValue: 'data.js',
    type: String,
  },
  // --tex-only
  {
    name: 'tex-only',
    alias: 't',
    defaultValue: false,
    type: Boolean,
  },
  // --pdf-only
  {
    name: 'pdf-only',
    alias: 'p',
    defaultValue: false,
    type: Boolean,
  },
  // --tex-options <ドキュメントクラスのオプション>
  {
    name: 'tex-options',
    alias: 'o',
    multiple: true,
    type: String,
  },
];
const opts = cmdArgs(optsDef, { camelCase: true });

// 差出人・宛先情報の読み込み

const absoluteConfigPath = path.join(process.cwd(), opts.file);
const pathToConfig = path.relative(__dirname, absoluteConfigPath);
const { sender, recipient } = require(pathToConfig);

// 主処理

const getAllMembers = (name: string, family: Array<string>): Array<string> => [
  name,
  ...(family ? family : []),
];

const formatAsEntry = (array: Array<string>): string => {
  return '{' + array.join(',') + '}';
};

const texToPdf = (workDir: string, fileName: string): void | Error => {
  const command = 'lualatex ' + fileName + '.tex';
  const opts = {
    cwd: workDir,
  };
  cp.exec(command, opts, (error: cp.ExecException | null): void | cp.ExecException | null => {
    if (error) {
      throw error;
    } else {
      console.log('  >> Generated file: ' + fileName + '.pdf');
    }
  });
};

const outputDir = path.resolve('output/');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const senderMembers = getAllMembers(sender.name, sender.family);
const filterRegex = new RegExp(opts.filter);

Object.keys(recipient).forEach((recipienetName: string): void => {
  if (filterRegex.test(recipienetName)) {
    // ファイル名
    const fileName = recipienetName.replace(' ', '_');
    if (!opts.pdfOnly) {
      // tex ファイルの中身の作成
      const recipientData = recipient[recipienetName];
      const recipientMembers = getAllMembers(
        recipienetName,
        recipientData.family
      );
      const texFileBody = `\\documentclass[${opts.texOptions}]{hagaki}
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
      const texFilePath = path.format({
        dir: outputDir,
        name: fileName,
        ext: '.tex',
      });
      // ファイルの作成
      fs.promises
        .writeFile(texFilePath, texFileBody)
        .then((): void => {
          console.log('  >> Generated file: ' + fileName + '.tex');
          if (!opts.texOnly) texToPdf(outputDir, fileName);
        })
        .catch((error: Error): Error => {
          throw error;
        });
    } else {
      texToPdf(outputDir, fileName);
    }
  }
});
