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
        const value = match[1]
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
    'auto-cols': {name: 'grid-auto-columns', attribute: 'custom'}
}