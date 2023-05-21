const fs = require('fs');
const path = require('path');

const arrDynamicClasses = [];

async function dynamicClasses(classNames, cssPath, outputPath){
    console.log("Dynamic", classNames)

    // Existing output
    const existingOutputCSS = await fs.promises.readFile(outputPath, 'utf-8');

    // Generate css-compatible output based on dynamic classes
    const output = classNames.map((className) => {
        const regex = /-\[(#(?:[0-9a-fA-F]{3}){1,2}|[0-9a-fA-F]{6})\]/;
        const match = className.match(regex);

        var css;
      
        if(match && !arrDynamicClasses.some(item => item === match.input)){
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

            if(className.substring(0, 2) === "bg"){
                css = `
                 .${str}{
                     background-color: ${color};
                 }`;

                arrDynamicClasses.push(match.input)
                return css;
            } else if(className.substring(0, 5) === "color"){
                css = `
                .${str}{
                    color: ${color};
                }`;

                arrDynamicClasses.push(match.input)
                return css;
            }
        }
      
        return '';
    }).join('');
      
    const newCSS = existingOutputCSS + '\n' + output;

    await fs.promises.writeFile(outputPath, newCSS, 'utf-8');
    console.log(arrDynamicClasses)
}

module.exports = dynamicClasses;
