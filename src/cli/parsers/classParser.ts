import { BaseStyle } from "types";
import dynamicParser from "./dynamicParser";

interface ClassParser {
    className: string,
    cssAttribute: string | string[],
    name: string | null,
    value?: string,
    pseudo: string,
    pseudoSeparator: ':' | '::'
}

export default function classParser(className: string, baseStyle: BaseStyle): ClassParser | null {
    const finalCSS = new Set();
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const dynamicPseudo = /^(.*?)-\[(.*?)\]$/;

    var cssString: null | string = null;
    /******************* Pseudo Classes *******************/
    if(className.includes(':') && !className.includes('::')){ 
        var pseudoClass = className.split(':')[0]
        const attribute = className.split(':')[1]
        const match = pseudoClass.match(dynamicPseudo)

        // If its a pseudoClass where the user needs to provide a value
        // E.g: :nth-child-(3)
        var newPseudoClass: null | string = null;

        // Identify a pseudo class that requires input
        if(pseudoClass.includes('-[') && match && _PSEUDO_CLASSES[match[1]]){
            newPseudoClass = match[0].replace('[', '(').replace(']', ')')
            pseudoClass = match[1]
        }

        if(_PSEUDO_CLASSES[pseudoClass] && baseStyle[attribute]){
            const value = baseStyle[attribute]
            return {
                className: `${(newPseudoClass && match) ? match[0].replace(specialChars, '\\$&') : pseudoClass}\\:${attribute}`,
                cssAttribute: Array.isArray(baseStyle[attribute]) ? value.map((e) => { return `${e}`}) : `${value}`,
                name: null,
                pseudo: newPseudoClass ? newPseudoClass.replace('-(', '(') : pseudoClass,
                pseudoSeparator: ':'
            }
        } else if(_PSEUDO_CLASSES[pseudoClass] && !baseStyle[attribute]){
            // Here would dynamicClasses combined with pseudoClass/Elements end up

            if(attribute.includes('-[')){
                const parsedString = dynamicParser(attribute)

                if(parsedString){
                    const { className, cssAttribute, name, value } = parsedString
                    return {
                        className: `${(newPseudoClass && match) ? match[0].replace(specialChars, '\\$&') : pseudoClass}\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: newPseudoClass ? newPseudoClass.replace('-(', '(') : pseudoClass,
                        pseudoSeparator: ':'
                    }
                }
            }
        }
    } 
    
    /******************* Pseudo Elements *******************/
    if(className.includes('::')){
        const pseudoClass = className.split('::')[0]
        const attribute = className.split('::')[1]

        if(PSEUDO_ELEMENTS.includes(pseudoClass) && baseStyle[attribute]){
            const value = baseStyle[attribute]
            return {
                className: `${pseudoClass}\\:\\:${attribute}`,
                cssAttribute: Array.isArray(baseStyle[attribute]) ? value.map((e) => { return `${e}`}) : `${value}`,
                name: null,
                pseudo: pseudoClass,
                pseudoSeparator: '::'
            }
        } else if(PSEUDO_ELEMENTS.includes(pseudoClass) && !baseStyle[attribute]){
            // Here would dynamicClasses combined with pseudoClass/Elements end up

            if(attribute.includes('-[')){
                const parsedString = dynamicParser(attribute)

                if(parsedString){
                    const { className, cssAttribute, name, value } = parsedString
                    return {
                        className: `${pseudoClass}\\:\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: pseudoClass,
                        pseudoSeparator: '::'
                    }
                }
            }
        }
    }

    return null;
}

export interface PseduoClasses {
    [key: string]: {
        isDynamic?: boolean,
        acceptedValues?: string[],
        description?: string
    }
}

export const PSEUDO_ELEMENTS = [
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
]

export const _PSEUDO_CLASSES: PseduoClasses = {
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
