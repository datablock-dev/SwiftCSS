import { BaseStyle, Config } from "types";
import { AttributeObject } from "../funnel";
import classParser from "../parsers/classParser";
import dynamicParser from "../parsers/dynamicParser";
import parentParser from "../parsers/parentParser";

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

    // Regex
    const dynamicPseudo = /^(.*?)-\[(.*?)\]$/;
    const parentRegex = /\([^)]+\):/;

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
            const parentSelectors: Set<string> = new Set();

            // Iterate through array and process individual classes
            cssAttributes.forEach((className) => {
                const parentMatch = className.match(parentRegex)
                if ((className.includes(':') || className.includes('::')) && !parentMatch) {
                    const classParsed = classParser(className, baseStyle)
                    if (classParsed) {
                        const { cssAttribute, pseudo, pseudoSeparator, pseudoSelector } = classParsed
                        if (typeof cssAttribute === 'string' || Array.isArray(cssAttribute)) {
                            pseudoClasses.add(`${pseudoSeparator}${pseudoSelector ? pseudoSelector : pseudo}`)
                        }
                    }
                } else if (className.includes('-[') && !parentMatch) { // Dynamic classes
                    const parsedString = dynamicParser(className)
                    if (parsedString) {
                        dynamicClasses.add(parsedString.cssAttribute)
                    }
                } else if (parentMatch) {
                    parentSelectors.add(attribute)
                } else { // Non-pseudo nor dynamic class
                    cssClasses.add(className)
                }
            })

            // Classes bound to pseudo class/element found
            if (pseudoClasses.size > 0) {
                Array.from(pseudoClasses).forEach((pseudo) => {
                    const match = pseudo.match(dynamicPseudo) // If the pseudo element has a selector
                    const finalSelector = `${selector}${match ? pseudo.replace('-[', '(').replace(']', ')') : pseudo}`
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

            /*
                Here we process parent selectors so that they are formatted
                the correct way
            */
            if (parentSelectors.size > 0) {
                parentSelectors.forEach((elementAttribute) => {
                    const parsedString = parentParser(elementAttribute, baseStyle)

                    if (parsedString) {
                        const { cssAttributes, dependency, dependencyType } = parsedString
                        const selector = dependencyType === "has" ? `${dependency}[${key}="${attribute}"]` : `${dependency} [${key}="${attribute}"]`
                        
                        if (!finalMediaObject[key].css[selector]) {
                            finalMediaObject[key].css[selector] = new Set();
                        }

                        try {
                            cssAttributes.forEach((item) => {
                                finalMediaObject[key].css[selector].add(item)
                            })
                        } catch (error) { 
                            console.log("Error in parsing parent selector for media queries: ", error)
                        }
                        
                    }
                })
            }

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
            const cssAttributes = css[selector]

            // Makes sure that we dont generate parent selectors
            // that will end up being empty
            if (cssAttributes.size > 0) {
                cssOutput += `\t${selector}{\n`

                cssAttributes.forEach((value) => {
                    cssOutput += `\t\t${value}\n`
                })

                // Close the current selector
                cssOutput += '\t}\n'
            }
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