import { Config } from "types";
import { _CONFIG } from "../../../main";

/**
 * The following function parses the the dynamicClassName
 * @param className string
 * @returns null | {className: string, cssAttribute: string, name: string, value: string}
 */
export default function dynamicParser(className: string){
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;

    //var cssString: string | null = null;
    const match = dynamicStyleRegex.exec(className)
    

    if(match){
        const firstIndex = className.indexOf('-[')
        // We need to escape special characters
        const escapedClassName = className.replace(specialChars, "\\$&")
        const value = getValue(match[1], _CONFIG) // Identify if value is a variable or not
        const dynamicClass = className.substring(0, firstIndex);

        if(value.substring(0, 3) === 'url' && dynamicClass === 'bg'){
            return {
                className: escapedClassName,
                cssAttribute: `background: ${value};`,
                name: 'background',
                value: value
            }
        }

        if(dynamicRegistry[dynamicClass]){
            const { name, attribute } = dynamicRegistry[dynamicClass]

            if(attribute === 'color' && (value.length === 7 || value.length === 4)){
                return {
                    className: escapedClassName,
                    cssAttribute: `${name}: ${value};`,
                    name: name,
                    value: value
                }
            } else if (Array.isArray(name) && attribute === "custom") {
                const cssString = name.map(property => `${property}: ${value.replaceAll('_', ' ')};`).join('\n');
                return {
                    className: escapedClassName,
                    cssAttribute: cssString, 
                    name: name,
                    value: value
                }
            } else {
                return {
                    className: escapedClassName,
                    cssAttribute: `${name}: ${value.replaceAll('_', ' ')};`,
                    name: name,
                    value: value
                }
            }
        }
    }

    return null;
}

function getValue(value: string, config: Config){
    // The value is a variable
    if(value[0] === "$" && Object.keys(config.variables).length > 0){
        try{
            if(config.variables[value]){
                return config.variables[value];
            }
        } catch(err) {
            console.log(err)
        }
    }

    return value;
}

interface Dynamicregistry {
    [key: string]: {
        name: string | string[]
        attribute: 'color' | 'url' | 'custom' | string[] | null
    }
}
export const dynamicRegistry: Dynamicregistry = {
    'animation': {name: 'animation', attribute: 'custom'}, // Allow for custom animation properties
    'bg': {name: 'background-color', attribute: 'color'},
    'bg-x': {name: 'background-position-x', attribute: 'custom'},
    'bg-y': {name: 'background-position-y', attribute: 'custom'},
    'bg-position': {name: 'background-position', attribute: 'custom'},
    'outline-color': {name: "outline-color", attribute: 'color'},
    'color': {name: 'color', attribute: 'color'},
    'content': {name: 'content', attribute: null},
    'col': {name: 'grid-column', attribute: 'custom'},
    'fill': {name: 'fill', attribute: 'color'},
    'brd': {name: "border", attribute: 'custom'},
    'brd-t': {name: "border-top", attribute: 'custom'},
    'brd-r': {name: "border-right", attribute: 'custom'},
    'brd-b': {name: "border-bottom", attribute: 'custom'},
    'brd-l': {name: "border-left", attribute: 'custom'},
    'brd-color': {name: 'border-color', attribute: 'color'},
    'brd-t-color': {name: 'border-top-color', attribute: 'color'},
    'brd-r-color': {name: 'border-right-color', attribute: 'color'},
    'brd-b-color': {name: 'border-bottom-color', attribute: 'color'},
    'brd-l-color': {name: 'border-left-color', attribute: 'color'},
    'brd-radius': {name: "border-radius", attribute: 'custom'},
    'brd-tl-radius': {name: "border-top-left-radius", attribute: 'custom'},
    'brd-bl-radius': {name: "border-bottom-left-radius", attribute: 'custom'},
    'brd-tr-radius': {name: "border-top-right-radius", attribute: 'custom'},
    'brd-br-radius': {name: "border-bottom-right-radius", attribute: 'custom'},
    'box-shadow': {name: "box-shadow", attribute: 'custom'},
    'max-w': {name: 'max-width', attribute: 'custom'},
    'min-w': {name: 'min-width', attribute: 'custom'},
    'mt': {name: "margin-top", attribute: 'custom'},
    'mr': {name: "margin-right", attribute: 'custom'},
    'mb': {name: "margin-bottom", attribute: 'custom'},
    'ml': {name: "margin-left", attribute: 'custom'},
    'mx': {name: ["margin-left", "margin-right"], attribute: 'custom'},
    'my': {name: ["margin-top",  "margin-bottom"], attribute: 'custom'},
    'pt': {name: "padding-top", attribute: 'custom'},
    'pr': {name: "padding-right", attribute: 'custom'},
    'pb': {name: "padding-bottom", attribute: 'custom'},
    'pl': {name: "padding-left", attribute: 'custom'},
    'px': {name: ["padding-left", "padding-right"], attribute: 'custom'},
    'py': {name: ["padding-top", "padding-bottom"], attribute: 'custom'},
    'w': {name: 'width', attribute: 'custom'},
    'max-h': {name: 'max-height', attribute: 'custom'},
    'min-h': {name: 'min-height', attribute: 'custom'},
    'h': {name: 'height', attribute: 'custom'},
    'top': {name: 'top', attribute: 'custom'},
    'bottom': {name: 'bottom', attribute: 'custom'},
    'left': {name: 'left', attribute: 'custom'},
    'right': {name: 'right', attribute: 'custom'},
    'gap': {name: 'gap', attribute: 'custom'},
    'gap-y': { name: 'row-gap', attribute: 'custom' },
    'grid-cols': {name: 'grid-template-columns', attribute: 'custom'},
    'grid-rows': {name: 'grid-template-rows', attribute: 'custom'},
    'auto-cols': {name: 'grid-auto-columns', attribute: 'custom'},
    'font': {name: 'font-family', attribute: 'custom'},
    'filter': {name: "filter", attribute: 'custom'},
    "transition": {name: "transition", attribute: 'custom'},
    "transform": {name: "transform", attribute: 'custom'},
    "decoration": {name: "text-decoration", attribute: 'custom'},
    'object': {name: "object-position", attribute: 'custom'},
    'stroke': {name: "stroke", attribute: 'color'}
}