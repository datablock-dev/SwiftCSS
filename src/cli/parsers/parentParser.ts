import { BaseStyle } from "types";
import dynamicParser from "./dynamicParser";

export default function parentParser(className: string, baseStyle: BaseStyle){
    /*
        The regex identifies patterns with square brackets followed by a ':'
        like hover:[div]:py-10 -> [div]:py-10
        or [div]:py-10 -> [div]:py-10
    */
    
    // Regex
    const regex = /\([^)]+\)/;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;

    const match = className.match(regex)
    const lastIndex = className.lastIndexOf(':')
    const css = new Array;
    var finalParentSelector: string | null = null
    
    if(match && lastIndex){
        const parentSelector = match[0].replace('(', '').replace(')', '').replace('_', ' ') // The selector inside the brackets
        const classSelector = className.substring(lastIndex + 1, className.length) // The class to be applied
        const selector = match.input // the full string

        if(!selector) return;

        // Fix the finalParentSelector (Maybe make it into a single line)
        if(parentSelector[0] === '.' || parentSelector[0] === '#'){
            finalParentSelector = `${parentSelector} .${selector.replace(specialChars, "\\$&")}{\n`
        } else {
            finalParentSelector = `${parentSelector} .${selector.replace(specialChars, "\\$&")}{\n`
        }

        if(baseStyle[classSelector]){
            css.push(...baseStyle[classSelector])

            return {
                parentSelector: finalParentSelector,
                cssSelector: selector,
                cssAttributes: css
            }
        } else {
            const dynamicValue = dynamicParser(classSelector)

            if(dynamicValue){
                const { cssAttribute } = dynamicValue
                css.push(cssAttribute)

                return {
                    parentSelector: finalParentSelector,
                    cssSelector: selector,
                    cssAttributes: css
                }
            }
        }
    }

    return null;
}