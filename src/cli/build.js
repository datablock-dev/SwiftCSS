const fs = require('fs')
const path = require('path')
const parseClassNamesFromHTML = require('./parseClass');
const mediaStyling = require('./parsers/mediaQueries')

function runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle) {
    const styleCSS = fs.readFileSync('./src/style.css', 'utf-8');
    const inputCSS = config.input ? fs.readFileSync(config.input, 'utf-8') : '';
    const filteredStyles = [];
    const finalStyles = [];
    const mediaQueries = []
    const attributes = {};

    function processFile(filePath) {
      const { classNames: fileClassNames, dynamicClassNames: fileDynamicClassNames, attributes, screenClasses: screenStyles } = parseClassNamesFromHTML(config, filePath, screenKeys);

      fileClassNames.forEach(className => classNames.add(className));
      Object.entries(fileDynamicClassNames).forEach(([className, classProperties]) => {
        dynamicClasses[className] = classProperties;
      });
      
      Object.entries(attributes).forEach(([attributeName, attributeValues]) => {
        attributeValues.forEach(attributeValue => {
          if (attributeName === 'style-dark') {
            if (!darkStyles[attributeValue]) {
                darkStyles[attributeValue] = [];
            }
            if (!darkStyles[attributeValue].includes(attributeValue)) {
                darkStyles[attributeValue].push(attributeValue);
            }
          }

          if (attributeName === 'style-light') {
            if (!lightStyles[attributeValue]) {
                lightStyles[attributeValue] = [];
            }
            if (!lightStyles[attributeValue].includes(attributeValue)) {
                lightStyles[attributeValue].push(attributeValue);
            }
          }
        });
      });

      const mediaObject = mediaStyling.generateMediaQuries(config.screens, screenStyles, finalStyles, styleCSS, baseStyle)
      mediaQueries.push(...mediaObject)
    };

    
    
    config.fileExtensions.forEach(extension => {
        config.directories.forEach(directory => {
            const files = getAllFilesInDir(directory, extension);
            // Process all files
            files.forEach(filePath => {
                processFile(filePath);
            });
        });
    });

    const mediaStyles = mediaStyling.finalMediaQuery(mediaQueries, config.screens)
    
    // To retreive pre-defined classes
    styleCSS.split('}').forEach(styleBlock => {
        const trimmedStyleBlock = styleBlock.trim();
        const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/);
        if (classNameMatch && classNameMatch[1]) {
            const className = classNameMatch[1];
            if (classNames.has(className)) {
                // Trim the style block and append '}' at the end
                finalStyles.push(trimmedStyleBlock + '}');
            }
        }
    });
  

    dynamicStyles.forEach(style => {
      filteredStyles.push(style);
    });

    // Create dynamic classes
    const dynamicClassStyles = [];
    Object.entries(dynamicClasses).forEach(([className, classProperties]) => {
        dynamicClassStyles.push(`.${className.replace(/[[]/g, '\\[').replace(/[\]]/g, '\\]').replace(/#/g, '\\#')} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
    });
      
    // Generate dynamic class styles
    finalStyles.push(...dynamicClassStyles);

    const createThemeStyles = (themeStyles, themeClassName) => {
        const cssRules = [];
      
        Object.entries(themeStyles).forEach(([className, attributeValues]) => {
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
      
            const cssRule = `[style-${themeClassName}="${className}"] {\n${cssProperties.join('\n')}\n}`;
            cssRules.push(cssRule);
          });
        });
      
        finalStyles.push(`${themeClassName}.light, body.${themeClassName} {\n${cssRules.join('\n')}\n}`);
    };
      
    
    createThemeStyles(lightStyles, 'light');
    createThemeStyles(darkStyles, 'dark');

    // Include input CSS styles
    finalStyles.push(inputCSS);

    // Dark and light mode styles
    const darkModeStyles = generateDynamicStyles('dark', Array.from(dynamicClassNames), styleCSS);
    const lightModeStyles = generateDynamicStyles('light', Array.from(dynamicClassNames), styleCSS);

    // Append dark and light mode styles
    finalStyles.push(...darkModeStyles);
    finalStyles.push(...lightModeStyles);
    finalStyles.push(...mediaStyles);

    // Include screen styles
    //finalStyles.push(...Object.values(screenStyles).map(style => style.rules.join('\n')));

    writeOutputCSS(config.output, [...filteredStyles, ...finalStyles]);
}

function writeOutputCSS(outputFilePath, styles) {
    const uniqueStyles = [...new Set(styles)];
  
    fs.writeFileSync(outputFilePath, uniqueStyles.join('\n'));
    console.log('Output CSS file generated:', outputFilePath);
}

function generateDynamicStyles(themeClassName, classNames, styleCSS) {
    const dynamicStyles = [];
    classNames.forEach(className => {
      const dynamicStyleRegex = new RegExp(`\\.${className}-(?:\\[([\\w#-]+)\\])`, 'g');
      const dynamicStyleMatches = styleCSS.match(dynamicStyleRegex);
  
      if (dynamicStyleMatches) {
        dynamicStyleMatches.forEach(match => {
          const dynamicStyle = match.replace(`.${className}`, '').trim();
          const parsedStyle = parseDynamicStyles(dynamicStyle);
          dynamicStyles.push(`.${className}${parsedStyle}`);
        });
      }
    });
  
    return dynamicStyles;
}

function parseDynamicStyles(style) {
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;
    let match;
    let parsedStyle = style;
  
    while ((match = dynamicStyleRegex.exec(style))) {
      const dynamicValue = match[1];
      const dynamicClassName = match[0];
      let dynamicStyleValue;
  
      if (dynamicValue.startsWith('url')) {
        const urlRegex = /^url\((.*)\)$/;
        const urlMatch = dynamicValue.match(urlRegex);
        if (urlMatch) {
          dynamicStyleValue = `url(${urlMatch[1]})`;
        }
      } else if (dynamicValue.startsWith('#')) {
        const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        const hexColorMatch = dynamicValue.match(hexColorRegex);
        if (hexColorMatch) {
          dynamicStyleValue = `#${hexColorMatch[1]}`;
        }
      }
  
      if (dynamicStyleValue) {
        parsedStyle = parsedStyle.replace(
          RegExp.escape(dynamicClassName),
          dynamicStyleValue
        );
      }
    }
  
    return parsedStyle;
}

function getAllFilesInDir(dir, ext, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fileList = getAllFilesInDir(filePath, ext, fileList);
        } else {
            if (path.extname(file) === `.${ext}`) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

module.exports = runBuildCommand