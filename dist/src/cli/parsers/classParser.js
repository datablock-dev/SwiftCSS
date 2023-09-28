"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSEUDO_ELEMENTS = exports.PSEUDO_CLASSES = void 0;
const dynamicParser_1 = __importDefault(require("./dynamicParser"));
function classParser(className, baseStyle) {
    const finalCSS = new Set();
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    var cssString = null;
    /******************* Pseudo Classes *******************/
    if (className.includes(':') && !className.includes('::')) {
        const pseudoClass = className.split(':')[0];
        const attribute = className.split(':')[1];
        if (exports.PSEUDO_CLASSES.includes(pseudoClass) && baseStyle[attribute]) {
            const value = baseStyle[attribute];
            return {
                className: `${pseudoClass}\\:${attribute}`,
                cssAttribute: Array.isArray(baseStyle[attribute]) ? value.map((e) => { return `${e}`; }) : `${value}`,
                name: null,
                pseudo: pseudoClass,
                pseudoSeparator: ':'
            };
        }
        else if (exports.PSEUDO_CLASSES.includes(pseudoClass) && !baseStyle[attribute]) {
            // Here would dynamicClasses combined with pseudoClass/Elements end up
            if (attribute.includes('-[')) {
                const parsedString = (0, dynamicParser_1.default)(attribute);
                if (parsedString) {
                    const { className, cssAttribute, name, value } = parsedString;
                    return {
                        className: `${pseudoClass}\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: pseudoClass,
                        pseudoSeparator: ':'
                    };
                }
            }
        }
    }
    /******************* Pseudo Elements *******************/
    if (className.includes('::')) {
        const pseudoClass = className.split('::')[0];
        const attribute = className.split('::')[1];
        if (exports.PSEUDO_ELEMENTS.includes(pseudoClass) && baseStyle[attribute]) {
            const value = baseStyle[attribute];
            return {
                className: `${pseudoClass}\\:\\:${attribute}`,
                cssAttribute: Array.isArray(baseStyle[attribute]) ? value.map((e) => { return `${e}`; }) : `${value}`,
                name: null,
                pseudo: pseudoClass,
                pseudoSeparator: '::'
            };
        }
        else if (exports.PSEUDO_ELEMENTS.includes(pseudoClass) && !baseStyle[attribute]) {
            // Here would dynamicClasses combined with pseudoClass/Elements end up
            if (attribute.includes('-[')) {
                const parsedString = (0, dynamicParser_1.default)(attribute);
                if (parsedString) {
                    const { className, cssAttribute, name, value } = parsedString;
                    return {
                        className: `${pseudoClass}\\:\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: pseudoClass,
                        pseudoSeparator: '::'
                    };
                }
            }
        }
    }
    return null;
}
exports.default = classParser;
exports.PSEUDO_CLASSES = [
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
exports.PSEUDO_ELEMENTS = [
    'after',
    'before',
    'first-line',
    'selection',
    'placeholder',
    'marker',
    'backdrop',
    'cue',
    'part',
    'slotted'
];
