const fs = require('fs')

function parseClassNamesFromHTML(config, filePath, screenKeys) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicClassRegex = /(\w+::|\w+:)?(bg|color|fill)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/g;
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

    // 
  
    while ((match = classRegex.exec(fileContent))) {
      const classValue = match[1];
      const individualClassNames = classValue.split(/\s+/);
      individualClassNames.forEach(className => classNames.add(className));
    }
  
    while ((match = dynamicClassRegex.exec(fileContent))) {
        // Format if its not undefined, get pseudo class without ":"
        const isPseudoClass = match[1] ? match[1].replace(/:/g, '') : undefined
        let pseudoClass = null;

        if(isPseudoClass && approvedPseudoClasses.includes(isPseudoClass)){
            pseudoClass = isPseudoClass;
        }

        //console.log(match[0], match[1], match[2])
        // bg-[#000] bg 000

        // hover:bg-[#000] hover bg 000
        const property = match[2];
        const value = match[3];
        dynamicClassNames[match[0].replace(/\w+::|\w+:/g, '')] = {
          property: property === 'bg' ? 'background-color' : property === 'color' ? 'color' : 'fill',
          value: '#' + value,
          pseudoClass: pseudoClass
        };

        console.log(dynamicClassNames)
    }
  
    while ((match = attributeRegex.exec(fileContent))) {
        const attributeName = match[1];
        const attributeValue = match[2];
        attributes[attributeName].push(attributeValue);
    }

    // For pseudo classes
    while ((match = pseudoRegex.exec(fileContent))){    
        //console.log(match[0])
        rawPseudoClasses.push(match[0])
        //attributes[attributeName].push(attributeValue);
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