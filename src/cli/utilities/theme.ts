import { BaseStyle, Config } from "types";
import { AttributeObject } from "../funnel";
import { PSEUDO_CLASSES, PSEUDO_ELEMENTS } from "../parsers/classParser";
import { dynamicRegistry } from "../parsers/dynamicParser";

export default function themeCSS(themeObject: AttributeObject, baseStyle: BaseStyle, config: Config){
    var cssStringDark = '\ndark.dark, body.dark {\n'
    var cssStringLight = '\nlight.light, body.light {\n'
    var css = '';

    var styleDark: FinalObject = {};
    var styleLight: FinalObject = {};

    // Regex
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;

    if(themeObject['style-dark']){
        const _STYLE_DARK = themeObject['style-dark']
        styleDark = parseTheme(_STYLE_DARK, 'style-dark', baseStyle);
        const finalStyle = buildTheme(cssStringDark, styleDark)
        //console.log(finalStyle);
        css += finalStyle;
    }

    if(themeObject['style-light']){
        const _STYLE_LIGHT = themeObject['style-light']
        styleLight = parseTheme(_STYLE_LIGHT, 'style-light', baseStyle);
        const finalStyle = buildTheme(cssStringLight, styleLight)
        css += finalStyle;
    }

    return css;
}

export interface FinalObject {
    [key: string]: Set<string>
}

function parseTheme(styleObject: Set<{attribute: string, cssAttributes: string[]}>, prefix: string, baseStyle: BaseStyle){
    // Under development
    const finalObject: FinalObject = {};

    // Regex
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/;

    styleObject.forEach((currStyle) => {
        const uniquePseudo: Set<string> = new Set();
        const nonPseudoAttributes: Set<string> = new Set();

        // cssAttributes --> Array of css attributes
        // attribute = Full attribute name -> "hover:cursor-pointer hover:color-[#f4f4f4] hover:cursor-pointer checked:color-[#49e31b]" 
        // retrieved from style-dark="" or style-light=""
        const { attribute, cssAttributes } = currStyle

        cssAttributes.forEach((attribute) => {
            if(attribute.includes(':') || attribute.includes('::')){
                const separator = attribute.includes(':') ? ':' : '::'
                const splitValue = attribute.split(separator)
                uniquePseudo.add(splitValue[0])
            } else {
                nonPseudoAttributes.add(attribute)
            }
        })

        // uniquePseudo has entries
        // We need to process unique pseudoClasses/Elements
        if(uniquePseudo.size > 0){
            uniquePseudo.forEach((pseudo) => {

                if(PSEUDO_CLASSES.includes(pseudo) || PSEUDO_ELEMENTS.includes(pseudo)){
                    // Define the key we use to find if it exists in the finalObject
                    const finalKey = `[${prefix}="${attribute}"]:${pseudo}`
                    const separator = PSEUDO_CLASSES.includes(pseudo) ? ':' : '::'

                    // These are the values that will be included when pseudoClass is applied (e.g. during hover)
                    const newCSSAttributes = currStyle.cssAttributes.filter((attribute) => attribute.includes(pseudo))

                    // Loop through cssAttributes and find dynamic classes
                    // The array will have className with pseudoClass/Element as a prefix
                    // e.g. -> hover:cursor-pointer, hover:bg-[#f4f4f4]
                    newCSSAttributes.forEach((cssAttribute) => {
                        const currValue = cssAttribute.split(separator)[1] // hover:color-[#fff] -> color-[#fff]

                        // Check after we have removed the pseudoClass if the class is a dynamic class
                        const match = dynamicStyleRegex.exec(currValue)
                        //console.log(currValue, match?.input)
                        
                        // If it is a Dynamic Class
                        if(match){   
                            //const classValue = match?.input; //color-[#f4f4f4]
                            const dynamicValue = match[1]; //#f4f4f4
                            const dynamicAttribute = currValue.substring(0, match.index) // color, bg, brd-color

                            if(dynamicRegistry[dynamicAttribute]){
                                const { name } = dynamicRegistry[dynamicAttribute];
                                const cssValue = `${name}: ${dynamicValue};`

                                if(!finalObject[finalKey]){
                                    finalObject[finalKey] = new Set();
                                    finalObject[finalKey].add(cssValue);
                                } else {
                                    finalObject[finalKey].add(cssValue);
                                }
                            }
                        } else { // Not a dynamic class
                            const value = baseStyle[currValue];

                            if(Array.isArray(value)){
                                value.forEach((item) => {
                                    if(!finalObject[finalKey]){
                                        finalObject[finalKey] = new Set();
                                        finalObject[finalKey].add(`${item};`);
                                    } else {
                                        finalObject[finalKey].add(`${item};`);
                                    }
                                })
                            } else {
                                if(!finalObject[finalKey]){
                                    finalObject[finalKey] = new Set();
                                    finalObject[finalKey].add(`${value};`);
                                } else {
                                    finalObject[finalKey].add(`${value};`);
                                }
                            }
                            //console.log(`DynamicMatch not found: ${currValue}. New value: ${value}`);
                        }
                    })
                }

            })
        }

        /*
            Here we process attributes that is not triggered by 
            a pseudo element or pseudo class
        */
        if(nonPseudoAttributes.size > 0){
            Array.from(nonPseudoAttributes).forEach((cssAttribute) => {
                const finalKey = `[${prefix}="${attribute}"]`

                const match = dynamicStyleRegex.exec(cssAttribute)
                if(match){
                    const dynamicValue = match[1]; //#f4f4f4
                    const dynamicAttribute = cssAttribute.substring(0, match.index) // color, bg, brd-color

                    if(dynamicRegistry[dynamicAttribute]){
                        const { name } = dynamicRegistry[dynamicAttribute];
                        const cssValue = `${name}: ${dynamicValue};`

                        if(!finalObject[finalKey]){
                            finalObject[finalKey] = new Set();
                            finalObject[finalKey].add(cssValue);
                        } else {
                            finalObject[finalKey].add(cssValue);
                        }
                    }
                } else { // Not a dynamic class
                    const value = baseStyle[cssAttribute];

                    if(Array.isArray(value)){
                        value.forEach((item) => {
                            if(!finalObject[finalKey]){
                                finalObject[finalKey] = new Set();
                                finalObject[finalKey].add(`${item};`);
                            } else {
                                finalObject[finalKey].add(`${item};`);
                            }
                        })
                    } else {
                        if(!finalObject[finalKey]){
                            finalObject[finalKey] = new Set();
                            finalObject[finalKey].add(`${value};`);
                        } else {
                            finalObject[finalKey].add(`${value};`);
                        }
                    }
                    //console.log(`DynamicMatch not found: ${currValue}. New value: ${value}`);
                }
            })

            //console.log(nonPseudoAttributes)
        }

    })

   return finalObject
}

// This function builds the final CSS for theme styling
function buildTheme(cssString: String, styleObject: FinalObject){
    var finalCssString = cssString;

    Object.keys(styleObject).forEach((key, index: number) => {
        const styleArray = styleObject[key];

        var currString = `\t${key} {\n`
        Array.from(styleArray).forEach((item, arrIndex, array) => {
            if(arrIndex + 1 === array.length){
                currString += `\t\t${item}\n`
                currString += `\t}\n`
            } else {
                currString += `\t\t${item}\n`
            }
        })

        finalCssString += currString
    })

    finalCssString += '}\n'

    return finalCssString
}