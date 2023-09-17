"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var cssnano_1 = require("cssnano");
var postcss_1 = require("postcss");
var cssnano_preset_lite_1 = require("cssnano-preset-lite");
var preset = (0, cssnano_preset_lite_1.default)({ discardComments: false });
var parseClass_1 = require("./parseClass");
var mediaQueries_1 = require("./parsers/mediaQueries");
var pseudo_1 = require("./parsers/pseudo");
var themes_1 = require("./parsers/themes");
var dynamicStyles_1 = require("./parsers/dynamicStyles");
function runBuildCommand(command, styleCSS, config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle) {
    var inputCSS = (config.input && config.input !== '') ? fs_1.default.readFileSync(config.input, 'utf-8') : '';
    var filteredStyles = new Array;
    var finalStyles = new Array;
    var mediaQueries = new Array;
    var pseudoClasses = new Array;
    var pseudoElements = new Array;
    var attributes = new Object;
    // Regex for special characters
    var specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    // Include input CSS styles (has to be appended in the beginning)
    finalStyles.push(inputCSS);
    /*
      We get all file extensions that are specified in the config file
      and we then go through each directory and look for files endind with the
      extensions that was provided in the config file.
    */
    config.fileExtensions.forEach(function (extension) {
        config.directories.forEach(function (directory) {
            var files = getAllFilesInDir(directory, extension);
            // Process all files
            files.forEach(function (filePath) {
                processFile(filePath);
            });
        });
    });
    function processFile(filePath) {
        var _a = (0, parseClass_1.default)(config, filePath, screenKeys), fileClassNames = _a.classNames, fileDynamicClassNames = _a.dynamicClassNames, attributes = _a.modeAttributes, screenStyles = _a.screenClasses, pseudoClass = _a.pseudoClasses;
        // @ts-ignore
        fileClassNames.forEach(function (className) { return classNames.add(className); });
        Object.entries(fileDynamicClassNames).forEach(function (_a) {
            var className = _a[0], classProperties = _a[1];
            // className -> bg-[#000], classProprety -> { property: "fill", value: #bg }
            dynamicClasses[className] = classProperties;
        });
        /************************** Mode Styling **************************/
        // This loop goes through all attributes for each of the mode styling (light or dark)
        Object.entries(attributes).forEach(function (_a) {
            var attributeName = _a[0], attributeValues = _a[1];
            // attributeName -> style-dark or style-light
            // attributeValues -> [bg-[#fff], fs-14] etc.
            attributeValues.forEach(function (attributeValue) {
                console.log(attributeValue);
                if (attributeName === 'style-dark') {
                    if (!darkStyles[attributeValue]) {
                        // Create new key with an empty array
                        darkStyles[attributeValue] = new Array;
                    }
                    if (!darkStyles[attributeValue].includes(attributeValue)) {
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
        pseudoClasses.push.apply(pseudoClasses, pseudoClass);
        var mediaObject = mediaQueries_1.default.generateMediaQuries(config.screens, screenStyles, finalStyles, styleCSS, baseStyle);
        mediaQueries.push.apply(mediaQueries, mediaObject);
    }
    ;
    var pseduoClassStyling = pseudo_1.default.parsePseudoClasses(pseudoClasses, baseStyle);
    var mediaStyles = mediaQueries_1.default.finalMediaQuery(mediaQueries, config.screens);
    // To retreive pre-defined classes
    styleCSS.split('}').forEach(function (styleBlock) {
        var trimmedStyleBlock = styleBlock.trim();
        var classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/);
        if (classNameMatch && classNameMatch[1]) {
            var className = classNameMatch[1];
            if (classNames.has(className)) {
                // Trim the style block and append '}' at the end
                finalStyles.push(trimmedStyleBlock + '}');
            }
        }
    });
    dynamicStyles.forEach(function (style) {
        filteredStyles.push(style);
    });
    // Create dynamic classes
    var dynamicClassStyles = new Array;
    Object.entries(dynamicClasses).forEach(function (_a) {
        var className = _a[0], classProperties = _a[1];
        if (classProperties.pseudoClass) {
            dynamicClassStyles.push(".".concat(classProperties.pseudoClass, "\\:").concat(className.replace(specialChars, "\\$&"), ":").concat(classProperties.pseudoClass, " {\n\t").concat(classProperties.property, ": ").concat(classProperties.value, ";\n}"));
        }
        else {
            //console.log(className, classProperties)
            dynamicClassStyles.push(".".concat(className.replace(specialChars, "\\$&"), " {\n\t").concat(classProperties.property, ": ").concat(classProperties.value, ";\n}"));
        }
    });
    // Generate dynamic class styles
    finalStyles.push.apply(finalStyles, dynamicClassStyles);
    finalStyles.push.apply(finalStyles, pseduoClassStyling);
    (0, themes_1.default)(lightStyles, 'light', finalStyles, dynamicClasses, styleCSS, baseStyle);
    (0, themes_1.default)(darkStyles, 'dark', finalStyles, dynamicClasses, styleCSS, baseStyle);
    // Include media styles
    finalStyles.push.apply(finalStyles, mediaStyles);
    // Dark and light mode styles
    var darkModeStyles = (0, dynamicStyles_1.generateDynamicStyles)('dark', Array.from(dynamicClassNames), styleCSS);
    var lightModeStyles = (0, dynamicStyles_1.generateDynamicStyles)('light', Array.from(dynamicClassNames), styleCSS);
    // Append dark and light mode styles
    finalStyles.push.apply(finalStyles, darkModeStyles);
    finalStyles.push.apply(finalStyles, lightModeStyles);
    // Include screen styles
    //finalStyles.push(...Object.values(screenStyles).map(style => style.rules.join('\n')));
    writeOutputCSS(command, config.output, __spreadArray(__spreadArray([], finalStyles, true), filteredStyles, true));
}
exports.default = runBuildCommand;
// The function that generates the output.
function writeOutputCSS(command, outputFilePath, styles) {
    var uniqueStyles = __spreadArray([], new Set(styles), true);
    // The build command compresses the css into a single row to reduce size
    // Processed through postcss
    if (command === "build") {
        (0, postcss_1.default)([cssnano_1.default])
            .process(uniqueStyles.join(''))
            .then(function (compressCSS) {
            fs_1.default.writeFileSync(outputFilePath, compressCSS.css);
        })
            .catch(function (err) {
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
function getAllFilesInDir(dir, ext, fileList) {
    if (fileList === void 0) { fileList = new Array; }
    var files = fs_1.default.readdirSync(dir);
    files.forEach(function (file) {
        var filePath = path_1.default.join(dir, file);
        var stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            fileList = getAllFilesInDir(filePath, ext, fileList);
        }
        else {
            if (path_1.default.extname(file) === ".".concat(ext)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}
module.exports = runBuildCommand;
