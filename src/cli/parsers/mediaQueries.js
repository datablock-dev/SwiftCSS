// Remove attribute, does not contribute in this function

function generateMediaQuries(screens, screenStyles, finalStyles, styleCSS, baseStyle){

    // Regex
    const dynamicClassRegex = /string-\[#\d{3,4}\]/; 
    const trimmedStyleAttribute = /{([^}]+)}/; // Trims and only retreives css attribute and not classname
    const classNameRegex = /^\s*([^{\s]+)/;
    const finalMediaQuery = []

    // Process styles for different screen sizes

    screenStyles.forEach(({ screenSize, property, attributes, value, mediaQuery}, index) => {
        attributes.forEach((attributeValue) => {
            // Dynamic Class
            if(dynamicClassRegex.test(attributeValue)){

            } else if(baseStyle[attributeValue]){ // Append css attributes
                screenStyles[index].value = `${screenStyles[index].value.trim()}\n ${baseStyle[attributeValue].trim()}`
            }
        });

        screenStyles[index].value = `${screenStyles[index].property}{\n${screenStyles[index].value}\n}`
    });

    return screenStyles;
}

function finalMediaQuery(mediaQueries, screens){
    const finalStyles = {}
    const cssOutput = []
    const filteredStyles = removeDuplicates(mediaQueries);

    Object.keys(screens).forEach((size) => {
        const screenSize = screens[size]

        if (screenSize.min && screenSize.max) {
            finalStyles[size] = {
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
        console.log(parent, value)
        const css = `${parent}${value.join('')}\n}`
        cssOutput.push(css)
    })
    
   return cssOutput;
}

// Helper function
function removeDuplicates(arr) {
    const propertyValues = arr.map(item => item.property);
    return arr.filter((item, index) => {
      return propertyValues.indexOf(item.property) === index;
    });
}

module.exports = { generateMediaQuries, finalMediaQuery }