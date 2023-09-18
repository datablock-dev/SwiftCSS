"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
/**
    * This function is being triggered per file
    * @param config Config object specified in swiftcss.config.js
    * @param filePath Path of the current file being processed
    * @param screenKeys Array of screen keys provided in the config.screens
    * @returns classNames, dynamicClassNames, attributes, screenClasses, pseudoClasses
**/
function parseClassNamesFromHTML(config, filePath, screenKeys) {
    const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicClassRegex = /(\w+::|\w+:)?(bg|color|fill|brd-color)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]|content-\[(.*?)\]/g;
    const attributeRegex = /\s+(style-dark|style-light)\s*=\s*"([^"]+)"/g;
    const pseudoRegex = /\b[a-z-]+:[^"\s]+/g;
    const pseudoElementRegex = /\b[a-z-]+::[^"\s]+/g;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const classNames = new Set();
    const dynamicClassNames = new Object;
    const screenClasses = new Array;
    const rawPseudoClasses = new Array;
    const modeAttributes = {
        'style-dark': [],
        'style-light': [],
    };
    let match;
    let isStyleAttribute = attributeRegex.exec(fileContent);
    // For attributes specified in class="" or className="" (for JSX or TSX)
    while ((match = classRegex.exec(fileContent))) {
        /*
            match[0] -> 'className="fill-[#f4f4f4] py-10prc"'
            match[1] -> 'fill-[#f4f4f4] py-10prc'
            match.input -> Entire String
            match.index -> number, index of where the match was found
        */
        const classValue = match[1];
        const individualClassNames = classValue.split(/\s+/);
        individualClassNames.forEach(className => {
            classNames.add(className);
        });
    }
    /*
        We should probably add a split for this function, where we also identify if
        it was within a class or in style-dark, style-light and others.
    */
    // If we have a dynamic styling
    while ((match = dynamicClassRegex.exec(fileContent))) {
        // Format if its not undefined, get pseudo class without ":"
        const isPseudoClass = match[1] ? match[1].replace(/:/g, '') : undefined;
        const property = match[2];
        const value = match[3];
        let pseudoClass = null;
        let finalProperty = '';
        let contentValue = ''; // If user defines content, then get the value
        if (isPseudoClass && approvedPseudoClasses.includes(isPseudoClass)) {
            pseudoClass = isPseudoClass;
        }
        if (property === "bg")
            finalProperty = "background-color";
        else if (property === "color")
            finalProperty = "color";
        else if (property === "fill")
            finalProperty = "fill";
        else if (property === "brd-color")
            finalProperty = "border-color";
        else if (property === "content")
            finalProperty = "content";
        if (!property) {
            try {
                finalProperty = match[0].split('-')[0] === "content" ? "content" : undefined;
                contentValue = match[0].split('-')[1].replace(/\[|\]/g, "");
            }
            catch (error) { }
        }
        //@ts-ignore
        dynamicClassNames[match[0].replace(/\w+::|\w+:/g, '')] = {
            property: finalProperty,
            value: finalProperty === "content" ? contentValue : '#' + value,
            pseudoClass: pseudoClass
        };
    }
    // style-dark or style-light
    while ((match = attributeRegex.exec(fileContent))) {
        const attributeName = match[1]; // style-dark / style-light
        const attributeValue = match[2]; // attributeValue (eg. bg-[#fff])
        modeAttributes[attributeName].push(attributeValue);
    }
    // For pseudo classes (without dark/light style)
    while ((match = pseudoRegex.exec(fileContent))) {
        const altRegex = /(\w+=")?([a-z-]+:[^"\s]+)(")?/g;
        const attribute = altRegex.exec(match.input); // attribute[0] -> (class/className)
        rawPseudoClasses.push(match[0]);
    }
    screenKeys.forEach((screenKey) => {
        const attributeRegex = new RegExp(`\\s+(style-${screenKey})\\s*=\\s*"([^"]+)"`, 'g');
        while ((match = attributeRegex.exec(fileContent))) {
            const screenSize = config.screens[screenKey];
            const tempObject = {
                property: `[${match[0].trim()}]`,
                attributes: match[2].split(' '),
                value: '',
                screenSize: screenKey,
                mediaQuery: ""
            };
            if (screenSize.min && screenSize.max) {
                tempObject.mediaQuery = `@media screen and (min-width: ${screenSize.min}px) and (max-width: ${screenSize.max}px)`;
            }
            else if (screenSize.min) {
                tempObject.mediaQuery = `@media screen and (min-width: ${screenSize.min}px)`;
            }
            else if (screenSize.max) {
                tempObject.mediaQuery = `@media screen and (max-width: ${screenSize.max}px)`;
            }
            screenClasses.push(tempObject);
        }
    });
    // Remove duplicats of pseudo classes
    const pseudoClasses = [...new Set(rawPseudoClasses)];
    //console.log(modeAttributes);
    return {
        classNames,
        dynamicClassNames,
        modeAttributes,
        screenClasses,
        pseudoClasses
    };
}
exports.default = parseClassNamesFromHTML;
const approvedPseudoClasses = [
    'active',
    'any',
    'any-link',
    'checked',
    'default',
    'defined',
    'dir',
    'disabled',
    'empty',
    'enabled',
    'first',
    'first-child',
    'first-of-type',
    'fullscreen',
    'focus',
    'focus-visible',
    'focus-within',
    'has',
    'hover',
    'indeterminate',
    'in-range',
    'invalid',
    'lang',
    'last-child',
    'last-of-type',
    'link',
    'not',
    'nth-child',
    'nth-last-child',
    'nth-last-of-type',
    'nth-of-type',
    'only-child',
    'only-of-type',
    'optional',
    'out-of-range',
    'placeholder-shown',
    'read-only',
    'read-write',
    'required',
    'root',
    'scope',
    'target',
    'target-within',
    'user-invalid',
    'valid',
    'visited',
    // Logical Combinations
    'is',
    'where',
];
module.exports = parseClassNamesFromHTML;
