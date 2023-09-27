import { BaseStyle } from "types";
import dynamicParser from "./dynamicParser";

export default function classParser(className: string, baseStyle: BaseStyle){
    const finalCSS = new Set();
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;

    var cssString: null | string = null;
    console.log(className)
    /******************* Pseudo Classes *******************/
    if(className.includes(':') && !className.includes('::')){ 
        const pseudoClass = className.split(':')[0]
        const attribute = className.split(':')[1]

        if(pseudoClasses.includes(pseudoClass) && baseStyle[attribute]){
            const value = baseStyle[attribute]
            return {
                className: `${pseudoClass}\\:${attribute}`,
                cssAttribute: value.map((e) => { return `${e};`}),
                name: null,
                pseudo: pseudoClass,
                pseudoSeparator: ':'
            }
        } else if(pseudoClasses.includes(pseudoClass) && !baseStyle[attribute]){
            // Here would dynamicClasses combined with pseudoClass/Elements end up

            if(attribute.includes('-[')){
                const parsedString = dynamicParser(attribute)

                if(parsedString){
                    const { className, cssAttribute, name, value } = parsedString
                    return {
                        className: `${pseudoClass}\\:${className}`,
                        cssAttribute: cssAttribute,
                        name: name,
                        value: value,
                        pseudo: pseudoClass,
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

        if(pseudoElements.includes(pseudoClass) && baseStyle[attribute]){
            const value = baseStyle[attribute]
            return {
                className: `${pseudoClass}\\:\\:${attribute}`,
                cssAttribute: value.map((e) => { return `${e};`}),
                name: null,
                pseudo: pseudoClass,
                pseudoSeparator: '::'
            }
        } else if(pseudoElements.includes(pseudoClass) && !baseStyle[attribute]){
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

const pseudoClasses = [
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

const pseudoElements = [
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