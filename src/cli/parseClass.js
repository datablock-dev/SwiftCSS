const fs = require('fs')

let styles = [];
function parseClassNamesFromHTML(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const classRegex = /(?:className|class)\s*=\s*"([^"]+)"/g;
    const dynamicClassRegex = /(bg|color|fill)-\[\#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/g;
    const attributeRegex = /\s+(style-dark|style-light)\s*=\s*"([^"]+)"/g;
    const classNames = new Set();
    const dynamicClassNames = {};
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
  
    return { classNames, dynamicClassNames, attributes };
}

function parseClass(classString) {
    const classNames = classString.split(' ');
  
    classNames.forEach(className => {
      if (styles.includes(className)) {
        // Handle the style...
        // This is where you would insert your logic for handling the style classes.
      }
    });
}
  

function updateStyles(screens) {
    styles = Object.keys(screens).map(screen => 'style-' + screen);
}

module.exports = parseClassNamesFromHTML