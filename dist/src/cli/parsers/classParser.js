"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._PSEUDO_CLASSES = exports.PSEUDO_ELEMENTS = void 0;
const dynamicParser_1 = __importDefault(require("./dynamicParser"));
function classParser(className, baseStyle) {
    const finalCSS = new Set(); // Also never read?
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const dynamicPseudo = /^(.*?)-\[(.*?)\]$/;
    var cssString = null; // Is this needed? It is never used
    /******************* Pseudo Classes *******************/
    if (className.includes(':') && !className.includes('::')) {
        var pseudoClass = className.split(':')[0];
        const attribute = className.split(':')[1];
        const match = pseudoClass.match(dynamicPseudo);
        // If its a pseudoClass where the user needs to provide a value
        // E.g: :nth-child-(3)
        var newPseudoClass = null;
        // Identify a pseudo class that requires input
        if (pseudoClass.includes('-[') && match && exports._PSEUDO_CLASSES[match[1]]) {
            newPseudoClass = match[0].replace('[', '(').replace(']', ')');
            pseudoClass = match[1];
        }
        if (exports._PSEUDO_CLASSES[pseudoClass] && baseStyle[attribute]) {
            const value = baseStyle[attribute];
            return {
                className: `${(newPseudoClass && match) ? match[0].replace(specialChars, '\\$&') : pseudoClass}\\:${attribute}`,
                cssAttribute: Array.isArray(baseStyle[attribute]) ? value.map((e) => { return `${e}`; }) : `${value}`,
                name: null,
                pseudo: newPseudoClass ? newPseudoClass.replace('-(', '(') : pseudoClass,
                pseudoSeparator: ':',
                pseudoSelector: match ? match[0] : null
            };
        }
        else if (exports._PSEUDO_CLASSES[pseudoClass] && !baseStyle[attribute]) {
            // Here would dynamicClasses combined with pseudoClass/Elements end up
            if (attribute.includes('-[')) {
                const parsedString = (0, dynamicParser_1.default)(attribute);
                if (parsedString) {
                    const { className, cssAttribute, name, value } = parsedString;
                    return {
                        className: `${(newPseudoClass && match) ? match[0].replace(specialChars, '\\$&') : pseudoClass}\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: newPseudoClass ? newPseudoClass.replace('-(', '(') : pseudoClass,
                        pseudoSeparator: ':',
                        pseudoSelector: match ? match[0] : null
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
exports._PSEUDO_CLASSES = {
    'active': {
        isDynamic: false
    },
    'any': {},
    'any-link': {},
    'checked': {
        isDynamic: false
    },
    'default': {},
    'defined': {},
    'dir': {
        isDynamic: true,
        acceptedValues: ['ltr', 'rtl'],
        description: "The :dir() CSS pseudo-class matches elements based on the directionality of the text contained in them."
    },
    'disabled': {
        isDynamic: false
    },
    'empty': {
        isDynamic: false
    },
    'enabled': {
        isDynamic: false
    },
    'first': {
        isDynamic: false
    },
    'first-child': {
        isDynamic: false
    },
    'first-of-type': {},
    'fullscreen': {},
    'focus': {
        isDynamic: false
    },
    'focus-visible': {},
    'focus-within': {},
    'has': {
        isDynamic: true
    },
    'hover': {
        isDynamic: false
    },
    'indeterminate': {},
    'in-range': {},
    'invalid': {},
    'lang': {
        isDynamic: true
    },
    'last-child': {},
    'last-of-type': {},
    'link': {},
    'not': {
        isDynamic: true
    },
    'nth-child': {
        isDynamic: true
    },
    'nth-last-child': {
        isDynamic: true
    },
    'nth-last-of-type': {
        isDynamic: true
    },
    'nth-of-type': {
        isDynamic: true
    },
    'only-child': {},
    'only-of-type': {
        isDynamic: false
    },
    'optional': {},
    'out-of-range': {},
    'placeholder-shown': {},
    'read-only': {},
    'read-write': {},
    'required': {},
    'root': {},
    'scope': {},
    'target': {},
    'target-within': {},
    'user-invalid': {},
    'valid': {},
    'visited': {
        isDynamic: false
    },
    // Logical Combinations
    'is': {
        isDynamic: true
    },
    'where': {
        isDynamic: true
    },
};
