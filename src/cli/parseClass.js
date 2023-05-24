const fs = require('fs')

// This function is being triggered per file
function parseClassNamesFromHTML(config, filePath, screenKeys) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicClassRegex = /(\w+::|\w+:)?(bg|color|fill|brd-color)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/g;
    const attributeRegex = /\s+(style-dark|style-light)\s*=\s*"([^"]+)"/g;
    const pseudoRegex = /\b[a-z-]+:[^"\s]+/g;
    const pseudoElementRegex = /\b[a-z-]+::[^"\s]+/g;
    const classNames = new Set();
    const dynamicClassNames = {};
    const screenClasses = []
    const rawPseudoClasses = []
    const attributes = {
        'style-dark': [],
        'style-light': [],
    };
    let match;
    let isStyleAttribute = attributeRegex.exec(fileContent);
  
    while ((match = classRegex.exec(fileContent))) {
      const classValue = match[1];
      const individualClassNames = classValue.split(/\s+/);
      individualClassNames.forEach(className => classNames.add(className));
    }
  
    while ((match = dynamicClassRegex.exec(fileContent))) {
        // Format if its not undefined, get pseudo class without ":"
        const isPseudoClass = match[1] ? match[1].replace(/:/g, '') : undefined
        const property = match[2];
        const value = match[3];
        let pseudoClass = null;
        let finalProperty = '';

        if(isPseudoClass && approvedPseudoClasses.includes(isPseudoClass)){
            pseudoClass = isPseudoClass;
        }

        if(property === "bg") finalProperty = "background-color"
        else if(property === "color") finalProperty = "color"
        else if(property === "fill") finalProperty = "fill"
        else if(property === "brd-color") finalProperty = "border-color"

        dynamicClassNames[match[0].replace(/\w+::|\w+:/g, '')] = {
          property: finalProperty,
          value: '#' + value,
          pseudoClass: pseudoClass
        };
    }
  
    while ((match = attributeRegex.exec(fileContent))) {
        const attributeName = match[1]; // style-dark / style-light
        const attributeValue = match[2]; // attributeValue
        attributes[attributeName].push(attributeValue);
    }

    // For pseudo classes (without dark/light style)
    while ((match = pseudoRegex.exec(fileContent) && !isStyleAttribute)){   
        rawPseudoClasses.push(match[0])
    }

    screenKeys.forEach(screenKey => {
        const attributeRegex = new RegExp(`\\s+(style-${screenKey})\\s*=\\s*"([^"]+)"`, 'g');
        while ((match = attributeRegex.exec(fileContent))){
            const screenSize = config.screens[screenKey]
            const tempObject = {
                property: `[${match[0].trim()}]`, // The name of the dynamic class
                attributes: match[2].split(' '), // Create an array of attributes
                value: '',
                screenSize: screenKey
            };
            
            if (screenSize.min && screenSize.max) {
                tempObject.mediaQuery = `@media screen and (min-width: ${screenSize.min}px) and (max-width: ${screenSize.max}px)`;
            } else if (screenSize.min) {
                tempObject.mediaQuery = `@media screen and (min-width: ${screenSize.min}px)`;
            } else if (screenSize.max) {
                tempObject.mediaQuery = `@media screen and (max-width: ${screenSize.max}px)`;
            }

            screenClasses.push(tempObject)
        }
    });

    // Remove duplicats of pseudo classes
    const pseudoClasses = [...new Set(rawPseudoClasses)] 
    
    return { classNames, dynamicClassNames, attributes, screenClasses, pseudoClasses };
}



const approvedPseudoClasses = [
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

module.exports = parseClassNamesFromHTML