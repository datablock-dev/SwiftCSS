import { BaseStyle, DynamicClasses, modeStyle, pseudoThemeClasses } from "types";

export default function createThemeStyles(themeStyles: modeStyle, themeClassName: string, finalStyles: any[], dynamicClasses: DynamicClasses, styleCSS: string, baseStyle: BaseStyle){
    const cssRules = new Array;
    const pseudoThemeClasses = new Object as pseudoThemeClasses;
      
    Object.entries(themeStyles).forEach(([className, attributeValues]) => {
        attributeValues.forEach(attributeValue => {

            // attributeValue --> color-[#000] bg-[#fff] hover:color-[#a414a4]
            const properties = attributeValue.split(/\s+/); // [color-[#000], bg-[#fff], hover:color-[#a414a4]]
            const cssProperties = new Array;
            
            properties.forEach(property => { // property --> color-[#000] or hover:color-[#a414a4]
              if (dynamicClasses[property]) {
                cssProperties.push(`${dynamicClasses[property].property}: ${dynamicClasses[property].value};`);
              } else {
                const propertyStyleMatch = styleCSS.match(new RegExp(`.${property} {([^}]*)}`));

                // Dynamic Class with pseudo-class
                if(property.includes(':') && dynamicClasses[property.split(':')[1]] && pseudoClasses.includes(property.split(':')[0])){ // Dynamic
                    const pseudoClass = property.split(':')[0] // hover
                    const cssAttribute = dynamicClasses[property.split(':')[1]] // { property: color, value: #000 }
                    const css = `${cssAttribute.property}: ${cssAttribute.value};` // color: #000
                    const selector = `[style-${themeClassName}="${className}"]:${pseudoClass}`

                    // If class doesnt exist
                    if(!pseudoThemeClasses[selector]){
                        if(!pseudoThemeClasses[selector]){
                            // If selector does not exist (i.e. key does not exist)
                            // Then we create an array with the css value
                            pseudoThemeClasses[selector] = [css]
                        } else {
                            pseudoThemeClasses[selector].push(css)
                        }
                    }
                } else if(property.includes(':') && baseStyle[property.split(':')[1]] && baseStyle[property.split(':')[1]] && pseudoClasses.includes(property.split(':')[0])){ // Non-dynamic
                    const pseudoClass = property.split(':')[0] // hover
                    const cssAttribute = baseStyle[property.split(':')[1]] // font-size: 14px;
                    const selector = `[style-${themeClassName}="${className}"]:${pseudoClass}`
                    if(!pseudoThemeClasses[selector]){
                        pseudoThemeClasses[selector] = [...cssAttribute]
                    } else {
                        pseudoThemeClasses[selector].push(...cssAttribute)
                    }
                }

                if (propertyStyleMatch) {
                  cssProperties.push(propertyStyleMatch[1].trim());
                }
              }
            });
        
            const cssRule = `[style-${themeClassName}="${className}"] {\n\t\t${cssProperties.join('\n\t\t')}\n\t}`;
            cssRules.push(cssRule);
        });
    });

    // Iterate through pseudoThemeClasses
    Object.keys(pseudoThemeClasses).forEach((selector: string) => {
        const attribute = pseudoThemeClasses[selector]
        const css = `${selector} {\n\t\t${attribute.join('\n\t\t')}\n\t}`
        cssRules.push(css)
    })
  
    finalStyles.push(`${themeClassName}.light, body.${themeClassName} {\n\t${cssRules.join('\n\t')}\n}`);
}

const pseudoClasses = [
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