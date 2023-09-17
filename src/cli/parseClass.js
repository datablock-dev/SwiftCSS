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
/**
    * This function is being triggered per file
    * @param config Config object specified in swiftcss.config.js
    * @param filePath Path of the current file being processed
    * @param screenKeys Array of screen keys provided in the config.screens
    * @returns classNames, dynamicClassNames, attributes, screenClasses, pseudoClasses
**/
function parseClassNamesFromHTML(config, filePath, screenKeys) {
    var fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
    var classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    var dynamicClassRegex = /(\w+::|\w+:)?(bg|color|fill|brd-color)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]|content-\[(.*?)\]/g;
    var attributeRegex = /\s+(style-dark|style-light)\s*=\s*"([^"]+)"/g;
    var pseudoRegex = /\b[a-z-]+:[^"\s]+/g;
    var pseudoElementRegex = /\b[a-z-]+::[^"\s]+/g;
    var specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    var classNames = new Set();
    var dynamicClassNames = new Object;
    var screenClasses = new Array;
    var rawPseudoClasses = new Array;
    var modeAttributes = {
        'style-dark': [],
        'style-light': [],
    };
    var match;
    var isStyleAttribute = attributeRegex.exec(fileContent);
    // For attributes specified in class="" or className="" (for JSX or TSX)
    while ((match = classRegex.exec(fileContent))) {
        /*
            match[0] -> 'className="fill-[#f4f4f4] py-10prc"'
            match[1] -> 'fill-[#f4f4f4] py-10prc'
            match.input -> Entire String
            match.index -> number, index of where the match was found
        */
        var classValue = match[1];
        var individualClassNames = classValue.split(/\s+/);
        individualClassNames.forEach(function (className) {
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
        var isPseudoClass = match[1] ? match[1].replace(/:/g, '') : undefined;
        var property = match[2];
        var value = match[3];
        var pseudoClass = null;
        var finalProperty = '';
        var contentValue = ''; // If user defines content, then get the value
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
        var attributeName = match[1]; // style-dark / style-light
        var attributeValue = match[2]; // attributeValue (eg. bg-[#fff])
        modeAttributes[attributeName].push(attributeValue);
    }
    // For pseudo classes (without dark/light style)
    while ((match = pseudoRegex.exec(fileContent))) {
        var altRegex = /(\w+=")?([a-z-]+:[^"\s]+)(")?/g;
        var attribute = altRegex.exec(match.input); // attribute[0] -> (class/className)
        rawPseudoClasses.push(match[0]);
    }
    screenKeys.forEach(function (screenKey) {
        var attributeRegex = new RegExp("\\s+(style-".concat(screenKey, ")\\s*=\\s*\"([^\"]+)\""), 'g');
        while ((match = attributeRegex.exec(fileContent))) {
            var screenSize = config.screens[screenKey];
            var tempObject = {
                property: "[".concat(match[0].trim(), "]"),
                attributes: match[2].split(' '),
                value: '',
                screenSize: screenKey,
                mediaQuery: ""
            };
            if (screenSize.min && screenSize.max) {
                tempObject.mediaQuery = "@media screen and (min-width: ".concat(screenSize.min, "px) and (max-width: ").concat(screenSize.max, "px)");
            }
            else if (screenSize.min) {
                tempObject.mediaQuery = "@media screen and (min-width: ".concat(screenSize.min, "px)");
            }
            else if (screenSize.max) {
                tempObject.mediaQuery = "@media screen and (max-width: ".concat(screenSize.max, "px)");
            }
            screenClasses.push(tempObject);
        }
    });
    // Remove duplicats of pseudo classes
    var pseudoClasses = __spreadArray([], new Set(rawPseudoClasses), true);
    console.log(modeAttributes);
    return {
        classNames: classNames,
        dynamicClassNames: dynamicClassNames,
        modeAttributes: modeAttributes,
        screenClasses: screenClasses,
        pseudoClasses: pseudoClasses
    };
}
exports.default = parseClassNamesFromHTML;
var approvedPseudoClasses = [
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
