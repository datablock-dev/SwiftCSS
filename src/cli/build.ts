import { Config, DynamicClasses } from "types"

const fs = require('fs')
const path = require('path')
const cssnano = require('cssnano')
const postcss = require('postcss')
const litePreset = require('cssnano-preset-lite')
const autoprefixer = require('autoprefixer')
const preset = litePreset({ discardComments: false });
const parseClassNamesFromHTML = require('./parseClass');
const mediaStyling = require('./parsers/mediaQueries')
const pseudoStyling = require('./parsers/pseudo');
const createThemeStyles = require('./parsers/themes')
const {parseDynamicStyles, generateDynamicStyles} = require('./parsers/dynamicStyles');

function runBuildCommand(command: string, styleCSS:string, config: Config, classNames: Set<String>, dynamicClassNames: Set<String>, dynamicStyles: Set<String>, dynamicClasses: DynamicClasses, lightStyles: Object, darkStyles: Object, screenKeys: any[string], baseStyle: string) {
    const inputCSS = (config.input && config.input !== '') ? fs.readFileSync(config.input, 'utf-8') : '';
    const filteredStyles = new Array;
    const finalStyles = new Array;
    const mediaQueries = new Array;
    const pseudoClasses = new Array;
    const pseudoElements = new Array;
    const attributes = new Object;

    // Regex for special characters
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;

    // Include input CSS styles (has to be appended in the beginning)
    finalStyles.push(inputCSS);

    /*
      We get all file extensions that are specified in the config file
      and we then go through each directory and look for files endind with the
      extensions that was provided in the config file.
    */
    config.fileExtensions.forEach((extension: string) => {
      config.directories.forEach((directory: string) => {
        const files = getAllFilesInDir(directory, extension);
        // Process all files
        files.forEach(filePath => {
          processFile(filePath);
        });
      });
    });

    function processFile(filePath: string) {
      const { classNames: fileClassNames, dynamicClassNames: fileDynamicClassNames, attributes, screenClasses: screenStyles, pseudoClasses: pseudoClass } 
      = parseClassNamesFromHTML(config, filePath, screenKeys);

      fileClassNames.forEach((className: string) => classNames.add(className));
      Object.entries(fileDynamicClassNames).forEach(([className, classProperties]) => {
        // className -> bg-[#000], classProprety -> { property: "fill", value: #bg }
        dynamicClasses[className as keyof DynamicClasses] = classProperties;
      });
      
      Object.entries(attributes).forEach(([attributeName, attributeValues]: any[string]) => {
          attributeValues.forEach((attributeValue: string) => {
              if (attributeName === 'style-dark') {
                // @ts-ignore
                if (!darkStyles[attributeValue]) {
                  // @ts-ignore
                  darkStyles[attributeValue] = new Array;
                }
                // @ts-ignore
                if (!darkStyles[attributeValue].includes(attributeValue)) {
                  // @ts-ignore
                  darkStyles[attributeValue].push(attributeValue);
                }
              }

              if (attributeName === 'style-light') {
                // @ts-ignore
                if (!lightStyles[attributeValue]) {
                  // @ts-ignore
                  lightStyles[attributeValue] = [];
                }
                // @ts-ignore
                if (!lightStyles[attributeValue].includes(attributeValue)) {
                  // @ts-ignore
                  lightStyles[attributeValue].push(attributeValue);
                }
              }
          });
      });

      // Push pseudo classes of a specific file to the array of all pseudo classes
      //console.log(pseudoClasses)
      pseudoClasses.push(...pseudoClass)

      const mediaObject = mediaStyling.generateMediaQuries(config.screens, screenStyles, finalStyles, styleCSS, baseStyle)
      mediaQueries.push(...mediaObject)
    };

    const pseduoClassStyling = pseudoStyling.parsePseudoClasses(pseudoClasses, baseStyle)
    const mediaStyles = mediaStyling.finalMediaQuery(mediaQueries, config.screens)
    
    // To retreive pre-defined classes
    styleCSS.split('}').forEach(styleBlock => {
        const trimmedStyleBlock = styleBlock.trim();
        const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/);
        if (classNameMatch && classNameMatch[1]) {
            const className = classNameMatch[1];
            if (classNames.has(className)) {
                // Trim the style block and append '}' at the end
                finalStyles.push(trimmedStyleBlock + '}');
            }
        }
    });
  
    dynamicStyles.forEach(style => {
      filteredStyles.push(style);
    });

    // Create dynamic classes
    const dynamicClassStyles = new Array;
    Object.entries(dynamicClasses).forEach(([className, classProperties]) => {
        if(classProperties.pseudoClass){
            dynamicClassStyles.push(`.${classProperties.pseudoClass}\\:${className.replace(specialChars, "\\$&")}:${classProperties.pseudoClass} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
        } else {
            //console.log(className, classProperties)
            dynamicClassStyles.push(`.${className.replace(specialChars, "\\$&")} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
        }
    });
      
    // Generate dynamic class styles
    finalStyles.push(...dynamicClassStyles);
    finalStyles.push(...pseduoClassStyling)      
    
    createThemeStyles(lightStyles, 'light', finalStyles, dynamicClasses, styleCSS, baseStyle);
    createThemeStyles(darkStyles, 'dark', finalStyles, dynamicClasses, styleCSS, baseStyle);
    
    // Include media styles
    finalStyles.push(...mediaStyles);

    // Dark and light mode styles
    const darkModeStyles = generateDynamicStyles('dark', Array.from(dynamicClassNames), styleCSS);
    const lightModeStyles = generateDynamicStyles('light', Array.from(dynamicClassNames), styleCSS);

    // Append dark and light mode styles
    finalStyles.push(...darkModeStyles);
    finalStyles.push(...lightModeStyles);

    // Include screen styles
    //finalStyles.push(...Object.values(screenStyles).map(style => style.rules.join('\n')));

    writeOutputCSS(command, config.output, [...finalStyles, ...filteredStyles]);
}

// The function that generates the output.
function writeOutputCSS(command: string, outputFilePath: string, styles: any[]) {
    const uniqueStyles = [...new Set(styles)];
  
    // The build command compresses the css into a single row to reduce size
    // Processed through postcss
    if(command === "build"){
      postcss([cssnano])
      .process(uniqueStyles.join(''))
      .then((compressCSS: any) => { // Needs to be specified
        fs.writeFileSync(outputFilePath, compressCSS.css);
      })
      .catch((err: any) => {
        console.error(err)
      })   
    } else {
      fs.writeFileSync(outputFilePath, uniqueStyles.join('\n'));
    }
    console.log('Output CSS file generated:', outputFilePath);
}

/*
  The following function find all files that exists across the 
*/
function getAllFilesInDir(dir: string, ext: string, fileList = new Array) {
    const files = fs.readdirSync(dir);

    files.forEach((file: string) => {
        const filePath = path.join(dir, file) as string;
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fileList = getAllFilesInDir(filePath, ext, fileList);
        } else {
            if (path.extname(file) === `.${ext}`) {
              fileList.push(filePath);
            }
        }
    });

    return fileList;
}

module.exports = runBuildCommand