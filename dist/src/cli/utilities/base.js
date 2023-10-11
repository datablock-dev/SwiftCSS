"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classParser_1 = __importDefault(require("../parsers/classParser"));
const dynamicParser_1 = __importDefault(require("../parsers/dynamicParser"));
const parentParser_1 = __importDefault(require("../parsers/parentParser"));
function classCSS(classArray, baseStyle, config) {
    const finalBaseCSS = new Set();
    const parentSelectors = {};
    // Regex
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const parentRegex = /\([^)]+\):/;
    try {
        classArray.forEach((className) => {
            if (baseStyle[className]) {
                var cssString = `.${className}{\n`;
                if (Array.isArray(baseStyle[className])) {
                    baseStyle[className].forEach((e, i, arr) => {
                        if ((i + 1) === arr.length) {
                            cssString += `\t${e}`;
                            cssString += '\n}';
                        }
                        else if (i + 1 !== arr.length) {
                            cssString += `\t${e}\n`;
                        }
                    });
                }
                else {
                    const value = baseStyle[className];
                    cssString += `\t${value}\n`;
                    cssString += '}';
                }
                finalBaseCSS.add(cssString);
            }
            else {
                // Here, we will most likely have a dynamic class or pseudoclass
                // Parse pseudoClasses & pseudoElements
                if (className.includes(':') || className.includes('::')) {
                    const parsedString = (0, classParser_1.default)(className, baseStyle);
                    if (parsedString) {
                        const { className, cssAttribute, name, value, pseudo, pseudoSeparator } = parsedString;
                        var cssString = `.${className}${pseudoSeparator}${pseudo}{\n`;
                        if (Array.isArray(cssAttribute)) {
                            cssAttribute.forEach((e, i, arr) => {
                                if ((i + 1) === arr.length) {
                                    cssString += `\t${e}`;
                                    cssString += '\n}';
                                }
                                else if (i + 1 !== arr.length) {
                                    cssString += `\t${e}\n`;
                                }
                            });
                        }
                        else {
                            cssString += `\t${cssAttribute}`;
                            cssString += '\n}';
                        }
                        finalBaseCSS.add(cssString);
                    }
                }
                // Parse Dynamic Classes
                if (className.match(dynamicStyleRegex)) {
                    const parsedString = (0, dynamicParser_1.default)(className);
                    if (parsedString) {
                        const { className, cssAttribute, name, value } = parsedString;
                        var cssString = `.${className}{\n`;
                        cssString += `\t${cssAttribute}`;
                        cssString += '\n}';
                        finalBaseCSS.add(cssString);
                    }
                }
                // Parse Parent Selections (not finished)
                if (className.match(parentRegex)) {
                    const parsedString = (0, parentParser_1.default)(className, baseStyle);
                    if (parsedString) {
                        const { parentSelector, cssAttributes } = parsedString;
                        if (!parentSelectors[parentSelector]) {
                            parentSelectors[parentSelector] = new Set;
                        }
                        let cssString = '';
                        cssAttributes.forEach((e, i, arr) => {
                            if ((i + 1) === arr.length) {
                                cssString += `\t${e}`;
                                cssString += '\n}';
                            }
                            else if (i + 1 !== arr.length) {
                                cssString += `\t${e}\n`;
                            }
                        });
                        parentSelectors[parentSelector].add(cssString);
                    }
                }
            }
        });
    }
    catch (err) {
        console.log(`An error has occurred: ${err}`);
    }
    // Parse parent Selections
    try {
        Object.keys(parentSelectors).forEach((key, index) => {
            const cssValue = Array.from(parentSelectors[key]).toString();
            var finalCSS = `${key}`;
            finalCSS += `${cssValue}`;
            finalBaseCSS.add(finalCSS);
        });
    }
    catch (error) {
        console.log(`An error has occurred: ${error}`);
    }
    //console.log(finalBaseCSS);
    //console.log(config.output.replace('output.css', 'test.css'));
    const css = Array.from(finalBaseCSS).join('\n');
    return css;
}
exports.default = classCSS;
