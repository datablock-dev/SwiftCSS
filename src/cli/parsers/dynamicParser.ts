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
        name: string
        attribute: 'color' | 'url' | 'custom' | string[] | null
    }
}
export const dynamicRegistry: Dynamicregistry = {
    'bg': {name: 'background-color', attribute: 'color'},
    'color': {name: 'color', attribute: 'color'},
    'content': {name: 'content', attribute: null},
    'fill': {name: 'fill', attribute: 'color'},
    'brd-color': {name: 'border-color', attribute: 'color'},
    'w': {name: 'width', attribute: 'custom'},
    'h': {name: 'height', attribute: 'custom'},
    'top': {name: 'top', attribute: 'custom'},
    'bottom': {name: 'bottom', attribute: 'custom'},
    'left': {name: 'left', attribute: 'custom'},
    'right': {name: 'right', attribute: 'custom'},
    'grid-cols': {name: 'grid-template-columns', attribute: 'custom'},
    'grid-rows': {name: 'grid-template-rows', attribute: 'custom'},
    'auto-cols': {name: 'grid-auto-columns', attribute: 'custom'},
    'font': {name: 'font-family', attribute: 'custom'}
}