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
    var finalBaseCSS = new Array;
    const finalMediaObject: FinalMediaObject = {}
    const dynamicPseudo = /^(.*?)-\[(.*?)\]$/;

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
            const dynamicClasses = new Set<string>

            // Iterate through array and process individual classes
            cssAttributes.forEach((className) => {
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
                    const parsedString = dynamicParser(className)
                    if (parsedString) {
                        dynamicClasses.add(parsedString.cssAttribute)
                    }
                } else { // Non-pseudo nor dynamic class
                    cssClasses.add(className)
                }
            })

            // Classes bound to pseudo class/element found
            if (pseudoClasses.size > 0) {
                Array.from(pseudoClasses).forEach((pseudo) => {
                    const match = pseudo.match(dynamicPseudo)
                    const finalSelector = `${selector}${pseudo}`
                    const pseudoWithoutSelector = pseudo.replace(/:+/g, '') // Remove ':' & '::'

                    if (!finalMediaObject[key].css[finalSelector]) {
                        finalMediaObject[key].css[finalSelector] = new Set()
                    }

                    // We need to select classes that should be applied
                    // When pseudo is triggered (e.g. during hover, only class 
                    // with hover:<className> should be included)
                    cssAttributes.forEach((className) => {
                        if (className.includes(pseudoWithoutSelector)) {
                            const newClass = className.replace(pseudoWithoutSelector, '').replace(/:+/g, '')
                            const baseMatch = baseStyle[newClass]

                            if (baseMatch) {
                                baseMatch.forEach((item) => {
                                    finalMediaObject[key].css[finalSelector].add(item)
                                })
                            } else {
                                const parsedString = dynamicParser(newClass)
                                if (parsedString) {
                                    finalMediaObject[key].css[finalSelector].add(parsedString.cssAttribute)
                                }
                            }
                        }
                    })
                })
            }

            // Non-pseudo classes found
            if (cssClasses.size > 0) {
                cssClasses.forEach((className) => {
                    if (!finalMediaObject[key].css[selector]) {
                        finalMediaObject[key].css[selector] = new Set()
                    }

                    const baseMatch = baseStyle[className]
                    if (baseMatch) {
                        baseMatch.forEach((item) => {
                            finalMediaObject[key].css[selector].add(item)
                        })
                    }
                })
            }

            if (dynamicClasses.size > 0) {
                dynamicClasses.forEach((className) => {
                    if (!finalMediaObject[key].css[selector]) {
                        finalMediaObject[key].css[selector] = new Set()
                    }

                    finalMediaObject[key].css[selector].add(className)
                })
            }
            //console.log(pseudoClasses)
            //console.log(cssClasses)

        })
    })

    /*
        Now finally, build the parent selectors, and their attribute classes
        within their corresponding parent selector (media query)
    */
    Object.keys(finalMediaObject).forEach((key) => {
        var cssOutput = ''

        const { parentString, css } = finalMediaObject[key]
        cssOutput += `/************* ${key} *************/\n`
        cssOutput += parentString

        // Loop through classSelectors of the current media query
        Object.keys(css).forEach((selector) => {
            // Selector --> [style-sd="w-100 h-40"]
            // css[selector] -> Set of finalised css attributes
            cssOutput += `\t${selector}{\n`
            const cssAttributes = css[selector]

            cssAttributes.forEach((value) => {
                cssOutput += `\t\t${value}\n`
            })

            // Close the current selector
            cssOutput += '\t}\n'
        })

        // Close the media query
        cssOutput += '}\n'

        finalBaseCSS.push(cssOutput);
    })

    return finalBaseCSS.join('\n');
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