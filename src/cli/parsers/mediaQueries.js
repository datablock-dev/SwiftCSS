
function mediaQuries(screens, screenStyles, attributes){
    // screenStyles = {}

    // Create screen styles object based on config
    if (screens) {
        Object.entries(screens).forEach(([screenName, screenSize]) => {
            screenStyles[screenName] = {
                mediaQuery: '',
                rules: []
            };
            
            if (screenSize.min && screenSize.max) {
                screenStyles[screenName].mediaQuery = `@media screen and (min-width: ${screenSize.min}px) and (max-width: ${screenSize.max}px)`;
            } else if (screenSize.min) {
                screenStyles[screenName].mediaQuery = `@media screen and (min-width: ${screenSize.min}px)`;
            } else if (screenSize.max) {
                screenStyles[screenName].mediaQuery = `@media screen and (max-width: ${screenSize.max}px)`;
            }
        });
    }

    // Process styles for different screen sizes
    Object.entries(screenStyles).forEach(([screenName, screenStyle]) => {
        const cssRules = [];
    
        Object.entries(attributes).forEach(([attributeName, attributeValues]) => {
            //console.log(attributeName, attributeValues)
          if (attributeName === `style-${screenName}`) {
            //console.log(screenName)
            attributeValues.forEach(attributeValue => {
              const properties = attributeValue.split(/\s+/);
              const cssProperties = [];
    
              properties.forEach(property => {
                if (dynamicClasses[property]) {
                  cssProperties.push(`${dynamicClasses[property].property}: ${dynamicClasses[property].value};`);
                } else {
                  const propertyStyleMatch = styleCSS.match(new RegExp(`.${property} {([^}]*)}`));
                  if (propertyStyleMatch) {
                    cssProperties.push(propertyStyleMatch[1].trim());
                  }
                }
              });
    
              const cssRule = `[style-${screenName}="${attributeValue}"] {\n${cssProperties.join('\n')}\n}`;
              cssRules.push(cssRule);
            });
          }
        });
    
        screenStyle.rules.push(...cssRules);
    });

}

module.exports = mediaQuries