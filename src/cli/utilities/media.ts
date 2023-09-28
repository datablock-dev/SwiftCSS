import { BaseStyle, Config } from "types";
import { AttributeObject } from "../funnel";
import classParser from "../parsers/classParser";
import dynamicParser from "../parsers/dynamicParser";

export interface FinalMediaObject {
    [key: string]: {
        parentString: string,
        css: {
            [key: string]: Set<string>
        }
    }
}

export default function mediaCSS(mediaObject: AttributeObject, baseStyle: BaseStyle, config: Config) {
    var css = '';
    const finalMediaObject: FinalMediaObject = {}

    // Regex
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;

    createParents(config.screens, finalMediaObject)
    //console.log(finalMediaObject)

    Object.keys(mediaObject).forEach((key) => {
        //key --> style-sd
        Array.from(mediaObject[key]).forEach((item) => {
            // Attribute holds the entire value provided in the style-element
            const { attribute, cssAttributes } = item
            const selector = `[${key}="${attribute}"]`

            const pseudoClasses = new Set<string>
            const cssClasses = new Set<string>

            // Iterate through array and process individual classes
            cssAttributes.forEach((className, index) => {
                if (className.includes(':') || className.includes('::')) {
                    const classParsed = classParser(className, baseStyle)
                    if (classParsed) {
                        const { cssAttribute, pseudo, pseudoSeparator } = classParsed
                        if (typeof cssAttribute === 'string') {
                            pseudoClasses.add(`${pseudoSeparator}${pseudo}`)
                            //cssAttribute.split('\n  ').forEach((item) => {
                            //    cssClasses.add(item)
                            //})
                        }
                    }
                } else if (className.includes('-[')) { // Dynamic classes
                    const parsedString = dynamicParser(attribute)
                    //console.log(parsedString)
                } else { // Non-pseudo nor dynamic class
                    cssClasses.add(className)
                }
            })

            if (pseudoClasses.size > 0) {
                Array.from(pseudoClasses).forEach((pseudo) => {
                    const finalSelector = `${selector}${pseudo}`
                    const pseudoWithoutSelector = pseudo.replace(/:+/g, '') // Remove ':' & '::'

                    if (!finalMediaObject[key].css[finalSelector]) {
                        finalMediaObject[key].css[finalSelector] = new Set()
                    }

                    // We need to select classes that should be applied
                    // When pseudo is triggered (e.g. during hover, only class 
                    // with hover:<className> should be included)
                    cssAttributes
                        .forEach((className) => {
                            if (className.includes(pseudoWithoutSelector)) {
                                const newClass = className.replace(pseudoWithoutSelector, '').replace(/:+/g, '')
                                const baseMatch = baseStyle[newClass]
                                
                                if(baseMatch){
                                    baseMatch.forEach((item) => { 
                                        finalMediaObject[key].css[finalSelector].add(item)
                                    })
                                }
                            }
                        })
                })
            }

            if (cssClasses.size > 0) {
                cssClasses.forEach((className) => {
                    if (!finalMediaObject[key].css[selector]) {
                        finalMediaObject[key].css[selector] = new Set()
                    }

                    const baseMatch = baseStyle[className]
                    if(baseMatch){
                        if(Array.isArray(baseMatch)){
                            baseMatch.forEach((item) => { 
                                finalMediaObject[key].css[selector].add(item)
                            })
                        } else {
                            finalMediaObject[key].css[selector].add(baseMatch)
                        }
                    }
                })
            }
            //console.log(pseudoClasses)
            //console.log(cssClasses)

        })
        if (key = 'style-sd') {
            console.log(finalMediaObject['style-sd'])
        }
    })

}

function createParents(screens: Config['screens'], finalMediaObject: FinalMediaObject) {
    Object.keys(screens).forEach((key) => {
        const { min, max } = screens[key]
        const selector = `style-${key}`;
        var parentString = '@media screen'
        if (min) {
            parentString += ` and (min-width: ${min}px)`
        }
        if (max) {
            parentString += ` and (max-width: ${max}px)`
        }
        parentString += '{\n'

        finalMediaObject[selector] = {
            parentString: parentString,
            css: {}
        };
    })
}