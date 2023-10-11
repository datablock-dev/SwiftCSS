"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dynamicParser_1 = __importDefault(require("./dynamicParser"));
function parentParser(className, baseStyle) {
    /*
        The regex identifies patterns with square brackets followed by a ':'
        like hover:[div]:py-10 -> [div]:py-10
        or [div]:py-10 -> [div]:py-10
    */
    // Regex
    const regex = /\([^)]+\)/;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const match = className.match(regex);
    const lastIndex = className.lastIndexOf(':');
    const css = new Array;
    var finalParentSelector = null;
    var dependencyType = null;
    if (match && lastIndex) {
        const parentSelector = match[0].replace('(', '').replace(')', '').replace('_', ' '); // The selector inside the brackets
        const classSelector = className.substring(lastIndex + 1, className.length); // The class to be applied
        const selector = match.input; // the full string
        if (!selector)
            return;
        // Fix the finalParentSelector
        // If the selector starts with a '&', we have then specified that the styling
        // should only be applied if a certain class exists as well!
        if (parentSelector[0] === '&') {
            finalParentSelector = `${parentSelector.replace('&', '')}.${selector.replace(specialChars, "\\$&")}{\n`;
            dependencyType = 'has';
        }
        else {
            finalParentSelector = `${parentSelector} .${selector.replace(specialChars, "\\$&")}{\n`;
            dependencyType = 'connect';
        }
        if (baseStyle[classSelector]) {
            css.push(...baseStyle[classSelector]);
            return {
                parentSelector: finalParentSelector,
                cssSelector: selector,
                cssAttributes: css,
                dependency: parentSelector.replace('&', ''),
                dependencyType: dependencyType
            };
        }
        else {
            const dynamicValue = (0, dynamicParser_1.default)(classSelector);
            if (dynamicValue) {
                const { cssAttribute } = dynamicValue;
                css.push(cssAttribute);
                return {
                    parentSelector: finalParentSelector,
                    cssSelector: selector,
                    cssAttributes: css,
                    dependency: parentSelector.replace('&', ''),
                    dependencyType: dependencyType
                };
            }
        }
    }
    return null;
}
exports.default = parentParser;
