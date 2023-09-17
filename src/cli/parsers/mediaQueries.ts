// Remove attribute, does not contribute in this function

import { BaseStyle, Config, MediaQueries, modeStyle } from "types";

export function generateMediaQuries(screens: Config["screens"], screenStyles: any, finalStyles: any[], styleCSS: string, baseStyle: BaseStyle){

    // Regex
    const dynamicClassRegex = /string-\[#\d{3,4}\]/; 
    const trimmedStyleAttribute = /{([^}]+)}/; // Trims and only retreives css attribute and not classname
    const classNameRegex = /^\s*([^{\s]+)/;
    const finalMediaQuery = new Array;

    // Process styles for different screen sizes

    interface test {
        screenSize: number
        property: string
        attributes: any[]
        value: string
        mediaQuery: MediaQueries
    }

    screenStyles.forEach(({ screenSize, property, attributes, value, mediaQuery}: test, index: number) => {
        attributes.forEach((attributeValue: string) => {
            // Dynamic Class
            if(dynamicClassRegex.test(attributeValue)){

            } else if(baseStyle[attributeValue]){ // Append css attributes
                // @ts-ignore
                screenStyles[index].value = `\t\t${screenStyles[index].value.trim()}\n ${baseStyle[attributeValue].trim()}`
            }
        });

        screenStyles[index].value = `\t${screenStyles[index].property}{\n${screenStyles[index].value.trim()}\n\t}\n`
    });

    return screenStyles;
}

export function finalMediaQuery(mediaQueries: any, screens: Config["screens"]){
    const finalStyles = new Object as MediaQueries;
    const cssOutput = new Array;
    const filteredStyles = removeDuplicates(mediaQueries);

    Object.keys(screens).forEach((size) => {
        const screenSize = screens[size]

        if (screenSize.min && screenSize.max) {
            finalStyles[size as keyof MediaQueries] = {
                parent: `@media screen and (min-width: ${screenSize.min}px) and (max-width: ${screenSize.max}px){\n`,
                value: []
            }
        } else if (screenSize.min) {
            finalStyles[size] = {
                parent: `@media screen and (min-width: ${screenSize.min}px){\n`,
                value: []
            }
        } else if (screenSize.max) {
            finalStyles[size] = {
                parent: `@media screen and (max-width: ${screenSize.max}px){\n`,
                value: []
            }
        }
    })

    // Push all styles into their parent
    filteredStyles.forEach((style) => {
        finalStyles[style.screenSize].value.push(style.value)
    })

    // Create the final output
    Object.entries(finalStyles).forEach(([screenSize, {parent, value}]) => {
        const css = `${parent}${value.join('')}\t\n}`
        cssOutput.push(css)
    })
    
   return cssOutput;
}

// Helper function
function removeDuplicates(arr: any[]) {
    const propertyValues = arr.map(item => item.property);
    return arr.filter((item, index) => {
      return propertyValues.indexOf(item.property) === index;
    });
}

// Will be implemented in the future for more advanced parsing of custom attributes
function uniqueAttributeCombinations(arr: any[]) {
    const seen = new Set();
    
    return arr.filter(item => {
      const sortedAttributes = [...item.attributes].sort().join(',');
      
      if (!seen.has(sortedAttributes)) {
        seen.add(sortedAttributes);
        return true;
      }
      
      return false;
    });
}