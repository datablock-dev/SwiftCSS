"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicRegistry = void 0;
const main_1 = require("../../../main");
/**
 * The following function parses the the dynamicClassName
 * @param className string
 * @returns null | {className: string, cssAttribute: string, name: string, value: string}
 */
function dynamicParser(className) {
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;
    //var cssString: string | null = null;
    const match = dynamicStyleRegex.exec(className);
    if (match) {
        const firstIndex = className.indexOf('-[');
        // We need to escape special characters
        const escapedClassName = className.replace(specialChars, "\\$&");
        const value = getValue(match[1], main_1._CONFIG); // Identify if value is a variable or not
        const dynamicClass = className.substring(0, firstIndex);
        if (value.substring(0, 3) === 'url' && dynamicClass === 'bg') {
            return {
                className: escapedClassName,
                cssAttribute: `background: ${value};`,
                name: 'background',
                value: value
            };
        }
        if (exports.dynamicRegistry[dynamicClass]) {
            const { name, attribute } = exports.dynamicRegistry[dynamicClass];
            if (attribute === 'color' && (value.length === 7 || value.length === 4)) {
                return {
                    className: escapedClassName,
                    cssAttribute: `${name}: ${value};`,
                    name: name,
                    value: value
                };
            }
            else if (Array.isArray(name) && attribute === "custom") {
                const cssString = name.map(property => `${property}: ${value.replaceAll('_', ' ')};`).join('\n');
                return {
                    className: escapedClassName,
                    cssAttribute: cssString,
                    name: name,
                    value: value
                };
            }
            else {
                return {
                    className: escapedClassName,
                    cssAttribute: `${name}: ${value.replaceAll('_', ' ')};`,
                    name: name,
                    value: value
                };
            }
        }
    }
    return null;
}
exports.default = dynamicParser;
function getValue(value, config) {
    // The value is a variable
    if (value[0] === "$" && Object.keys(config.variables).length > 0) {
        try {
            if (config.variables[value]) {
                return config.variables[value];
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    return value;
}
exports.dynamicRegistry = {
    'bg': { name: 'background-color', attribute: 'color' },
    'outline-color': { name: "outline-color", attribute: 'color' },
    'color': { name: 'color', attribute: 'color' },
    'content': { name: 'content', attribute: null },
    'fill': { name: 'fill', attribute: 'color' },
    'brd': { name: "border", attribute: 'custom' },
    'brd-t': { name: "border-top", attribute: 'custom' },
    'brd-r': { name: "border-right", attribute: 'custom' },
    'brd-b': { name: "border-bottom", attribute: 'custom' },
    'brd-l': { name: "border-left", attribute: 'custom' },
    'brd-color': { name: 'border-color', attribute: 'color' },
    'brd-t-color': { name: 'border-top-color', attribute: 'color' },
    'brd-r-color': { name: 'border-right-color', attribute: 'color' },
    'brd-b-color': { name: 'border-bottom-color', attribute: 'color' },
    'brd-l-color': { name: 'border-left-color', attribute: 'color' },
    'brd-radius': { name: "border-radius", attribute: 'custom' },
    'brd-tl-radius': { name: "border-top-left-radius", attribute: 'custom' },
    'brd-bl-radius': { name: "border-bottom-left-radius", attribute: 'custom' },
    'brd-tr-radius': { name: "border-top-right-radius", attribute: 'custom' },
    'brd-br-radius': { name: "border-bottom-right-radius", attribute: 'custom' },
    'max-w': { name: 'max-width', attribute: 'custom' },
    'min-w': { name: 'min-width', attribute: 'custom' },
    'mt': { name: "margin-top", attribute: 'custom' },
    'mr': { name: "margin-right", attribute: 'custom' },
    'mb': { name: "margin-bottom", attribute: 'custom' },
    'ml': { name: "margin-left", attribute: 'custom' },
    'pt': { name: "padding-top", attribute: 'custom' },
    'pr': { name: "padding-right", attribute: 'custom' },
    'pb': { name: "padding-bottom", attribute: 'custom' },
    'pl': { name: "padding-left", attribute: 'custom' },
    'px': { name: ["padding-left", "padding-right"], attribute: 'custom' },
    'py': { name: ["padding-top", "padding-bottom"], attribute: 'custom' },
    'w': { name: 'width', attribute: 'custom' },
    'max-h': { name: 'max-height', attribute: 'custom' },
    'min-h': { name: 'min-height', attribute: 'custom' },
    'h': { name: 'height', attribute: 'custom' },
    'top': { name: 'top', attribute: 'custom' },
    'bottom': { name: 'bottom', attribute: 'custom' },
    'left': { name: 'left', attribute: 'custom' },
    'right': { name: 'right', attribute: 'custom' },
    'gap': { name: 'gap', attribute: 'custom' },
    'grid-cols': { name: 'grid-template-columns', attribute: 'custom' },
    'grid-rows': { name: 'grid-template-rows', attribute: 'custom' },
    'auto-cols': { name: 'grid-auto-columns', attribute: 'custom' },
    'font': { name: 'font-family', attribute: 'custom' },
    "transition": { name: "transition", attribute: 'custom' },
    "decoration": { name: "text-decoration", attribute: 'custom' }
};
