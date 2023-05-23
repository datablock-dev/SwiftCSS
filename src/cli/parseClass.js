const fs = require('fs')

function parseClassNamesFromHTML(filePath, screenKeys) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicClassRegex = /(bg|color|fill)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/g;
    const attributeRegex = /\s+(style-dark|style-light)\s*=\s*"([^"]+)"/g;
    const classNames = new Set();
    const dynamicClassNames = {};
    const screenClasses = {}
    const attributes = {
        'style-dark': [],
        'style-light': [],
    };
    let match;
  
    while ((match = classRegex.exec(fileContent))) {
      const classValue = match[1];
      const individualClassNames = classValue.split(/\s+/);
      individualClassNames.forEach(className => classNames.add(className));
    }
  
    while ((match = dynamicClassRegex.exec(fileContent))) {
        const property = match[1];
        const value = match[2];
        dynamicClassNames[match[0]] = {
          property: property === 'bg' ? 'background-color' : property === 'color' ? 'color' : 'fill',
          value: '#' + value
        };
    }
  
    while ((match = attributeRegex.exec(fileContent))) {
        const attributeName = match[1];
        const attributeValue = match[2];
        attributes[attributeName].push(attributeValue);
    }

    screenKeys.forEach(screenKey => {
        const attributeRegex = new RegExp(`\\s+(style-${screenKey})\\s*=\\s*"([^"]+)"`, 'g');
        while ((match = attributeRegex.exec(fileContent))) {
            screenClasses[screenKey].push(match[0].trim())

            //const attributeName = match[1];
            //const attributeValue = match[2];
            //attributes[attributeName].push(attributeValue);
        }//
    });
    
    console.log(screenClasses)
    return { classNames, dynamicClassNames, attributes };
}

module.exports = parseClassNamesFromHTML