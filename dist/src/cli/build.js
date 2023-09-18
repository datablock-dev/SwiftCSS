"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const postcss_1 = __importDefault(require("postcss"));
const parseClass_1 = __importDefault(require("./parseClass"));
const mediaQueries_1 = require("./parsers/mediaQueries");
const pseudo_1 = __importDefault(require("./parsers/pseudo"));
const themes_1 = __importDefault(require("./parsers/themes"));
const dynamicStyles_1 = require("./parsers/dynamicStyles");
function runBuildCommand(command, styleCSS, config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle) {
    const inputCSS = (config.input && config.input !== '') ? fs_1.default.readFileSync(config.input, 'utf-8') : '';
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
    config.fileExtensions.forEach((extension) => {
        config.directories.forEach((directory) => {
            const files = getAllFilesInDir(directory, extension);
            // Process all files
            files.forEach(filePath => {
                processFile(filePath);
            });
        });
    });
    function processFile(filePath) {
        const { classNames: fileClassNames, dynamicClassNames: fileDynamicClassNames, modeAttributes: attributes, screenClasses: screenStyles, pseudoClasses: pseudoClass } = (0, parseClass_1.default)(config, filePath, screenKeys);
        // @ts-ignore
        fileClassNames.forEach((className) => classNames.add(className));
        Object.entries(fileDynamicClassNames).forEach(([className, classProperties]) => {
            // className -> bg-[#000], classProprety -> { property: "fill", value: #bg }
            dynamicClasses[className] = classProperties;
        });
        /************************** Mode Styling **************************/
        // This loop goes through all attributes for each of the mode styling (light or dark)
        Object.entries(attributes).forEach(([attributeName, attributeValues]) => {
            // attributeName -> style-dark or style-light
            // attributeValues -> [bg-[#fff], fs-14] etc.
            attributeValues.forEach((attributeValue) => {
                //console.log(attributeValue.split(' '))
                if (attributeName === 'style-dark') {
                    if (!darkStyles[attributeValue]) {
                        // Create new key with an empty array
                        darkStyles[attributeValue] = new Array;
                    }
                    if (!darkStyles[attributeValue].includes(attributeValue)) {
                        //console.log(attributeValue)
                        darkStyles[attributeValue].push(attributeValue);
                    }
                }
                if (attributeName === 'style-light') {
                    if (!lightStyles[attributeValue]) {
                        lightStyles[attributeValue] = new Array;
                    }
                    if (!lightStyles[attributeValue].includes(attributeValue)) {
                        lightStyles[attributeValue].push(attributeValue);
                    }
                }
            });
        });
        // Push pseudo classes of a specific file to the array of all pseudo classes
        //console.log(pseudoClasses)
        pseudoClasses.push(...pseudoClass);
        const mediaObject = (0, mediaQueries_1.generateMediaQuries)(config.screens, screenStyles, finalStyles, styleCSS, baseStyle);
        mediaQueries.push(...mediaObject);
    }
    ;
    const pseduoClassStyling = (0, pseudo_1.default)(pseudoClasses, baseStyle);
    const mediaStyles = (0, mediaQueries_1.finalMediaQuery)(mediaQueries, config.screens);
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
        if (classProperties.pseudoClass) {
            dynamicClassStyles.push(`.${classProperties.pseudoClass}\\:${className.replace(specialChars, "\\$&")}:${classProperties.pseudoClass} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
        }
        else {
            //console.log(className, classProperties)
            dynamicClassStyles.push(`.${className.replace(specialChars, "\\$&")} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
        }
    });
    // Generate dynamic class styles
    finalStyles.push(...dynamicClassStyles);
    finalStyles.push(...pseduoClassStyling);
    (0, themes_1.default)(lightStyles, 'light', finalStyles, dynamicClasses, styleCSS, baseStyle);
    (0, themes_1.default)(darkStyles, 'dark', finalStyles, dynamicClasses, styleCSS, baseStyle);
    // Include media styles
    finalStyles.push(...mediaStyles);
    // Dark and light mode styles
    const darkModeStyles = (0, dynamicStyles_1.generateDynamicStyles)('dark', Array.from(dynamicClassNames), styleCSS);
    const lightModeStyles = (0, dynamicStyles_1.generateDynamicStyles)('light', Array.from(dynamicClassNames), styleCSS);
    // Append dark and light mode styles
    finalStyles.push(...darkModeStyles);
    finalStyles.push(...lightModeStyles);
    // Include screen styles
    //finalStyles.push(...Object.values(screenStyles).map(style => style.rules.join('\n')));
    writeOutputCSS(command, config.output, [...finalStyles, ...filteredStyles]);
}
exports.default = runBuildCommand;
// The function that generates the output.
function writeOutputCSS(command, outputFilePath, styles) {
    const uniqueStyles = [...new Set(styles)];
    // The build command compresses the css into a single row to reduce size
    // Processed through postcss
    if (command === "build") {
        (0, postcss_1.default)()
            .process(uniqueStyles.join(''))
            .then((compressCSS) => {
            fs_1.default.writeFileSync(outputFilePath, compressCSS.css);
        })
            .catch((err) => {
            console.error(err);
        });
    }
    else {
        fs_1.default.writeFileSync(outputFilePath, uniqueStyles.join('\n'));
    }
    // Maybe remove this
    console.log('Output CSS file generated:', outputFilePath);
}
/*
  The following function find all files that exists across the
*/
function getAllFilesInDir(dir, ext, fileList = new Array) {
    const files = fs_1.default.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            fileList = getAllFilesInDir(filePath, ext, fileList);
        }
        else {
            if (path_1.default.extname(file) === `.${ext}`) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}
module.exports = runBuildCommand;
