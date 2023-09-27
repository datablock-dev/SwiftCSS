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

        if(dynamicRegistry[dynamicClass]){
            const { name, attribute } = dynamicRegistry[dynamicClass]

            if(attribute === 'color' && (value.length === 7 || value.length === 4)){
                return {
                    className: escapedClassName,
                    cssAttribute: `${name}: ${value};`,
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
        attribute: 'color' | null
    }
}
export const dynamicRegistry: Dynamicregistry = {
    'bg': {name: 'background-color', attribute: 'color'},
    'color': {name: 'color', attribute: 'color'},
    'content': {name: 'content', attribute: null},
    'fill': {name: 'fill', attribute: 'color'},
    'brd-color': {name: 'border-color', attribute: 'color'}
}