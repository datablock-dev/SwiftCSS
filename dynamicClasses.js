const fs = require('fs');
const path = require('path');

let arrDynamicClasses = [];

async function dynamicClasses(classNames, cssPath, outputPath) {
  // Has there been a new class added?
  let isUpdated = false;
  const existingOutputCSS = await fs.promises.readFile(outputPath, 'utf-8');

  // Regex for dynamic classes
  const regex = /-\[(#(?:[0-9a-fA-F]{3}){1,2}|[0-9a-fA-F]{6})\]/;

  console.log("Dynamic", classNames);

  // Iterate over classNames to find new classes
  classNames.forEach((className) => {
    const match = className.match(regex);
    if (match && !arrDynamicClasses.includes(match.input)) {
      arrDynamicClasses.push(match.input);
      isUpdated = true;
    }
  });

  if (isUpdated) {
    const output = arrDynamicClasses.map((className) => {
      const match = className.match(regex);
      const color = match[1];

      const arr = className.split("");
      let shouldAddBackslash = false;
      const modifiedArr = arr.reduce((result, char, index) => {
        if (char === '-') {
          shouldAddBackslash = true;
          result.push(char, '\\');
        } else if (char === '[' && shouldAddBackslash) {
          result.push(char, '\\');
        } else if (char === ']' && shouldAddBackslash) {
          result.push('\\', char);
          shouldAddBackslash = false;
        } else {
          result.push(char);
        }
        return result;
      }, []);

      const str = modifiedArr.join('');

      if (className.substring(0, 2) === "bg") {
        return `
                 .${str}{
                     background-color: ${color};
                 }`;
      } else if (className.substring(0, 5) === "color") {
        return `
                .${str}{
                    color: ${color};
                }`;
      }

      return '';
    }).join('');

    const newCSS = existingOutputCSS + '\n' + output;
    await fs.promises.writeFile(outputPath, newCSS, 'utf-8');
  }

  console.log(arrDynamicClasses);
}

module.exports = dynamicClasses;
