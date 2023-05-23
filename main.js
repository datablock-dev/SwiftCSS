const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const configFile = 'smoothstyle.config.js';
const defaultConfig = {
  fileExtensions: ['html', 'js', 'jsx', 'ts', 'tsx'],
  directories: ['./src'],
  input: '',
  output: './output.css',
};

// Load configuration
let config;
if (fs.existsSync(configFile)) {
  config = require(path.resolve(configFile));
} else {
  console.error('Configuration file not found. Run "init" command first.');
  process.exit(1);
}

// Check if directories exist
for (const directory of config.directories) {
  if (!fs.existsSync(directory)) {
    console.error(`Directory not found: ${directory}`);
    process.exit(1);
  }
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

function writeOutputCSS(outputFilePath, styles) {
  const uniqueStyles = [...new Set(styles)];

  fs.writeFileSync(outputFilePath, uniqueStyles.join('\n'));
  console.log('Output CSS file generated:', outputFilePath);
}

const classNames = new Set();
const dynamicClassNames = new Set();
const dynamicStyles = new Set();
const dynamicClasses = {};
const lightStyles = {}; 
const darkStyles = {};

function runBuildCommand() {
    const styleCSS = fs.readFileSync('style.css', 'utf-8');
    const inputCSS = config.input ? fs.readFileSync(config.input, 'utf-8') : '';
    const attributes = {};
    const screenStyles = {};

    function processFile(filePath) {
      const { classNames: fileClassNames, dynamicClassNames: fileDynamicClassNames, attributes } = parseClassNamesFromHTML(filePath);
  
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
    };

    // Create screen styles object based on config
    if (config.screens) {
        Object.entries(config.screens).forEach(([screenName, screenSize]) => {
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

            Object.entries(dynamicClasses).forEach(([className, classProperties]) => {
                if (className.startsWith(screenName)) {
                    screenStyles[screenName].rules.push(`.${className.replace(/[[]/g, '\\[').replace(/[\]]/g, '\\]').replace(/#/g, '\\#')} {\n\t${classProperties.property}: ${classProperties.value};\n}`);
                }
            });
        });
    }

    // Process styles for different screen sizes
    Object.entries(screenStyles).forEach(([screenName, screenStyleQueries]) => {
        const cssRules = [];
    
        Object.entries(attributes).forEach(([attributeName, attributeValues]) => {
          if (attributeName === `style-${screenName}`) {
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
    
        screenStyleQueries.push(cssRules.join('\n'));
    });

    Object.entries(screenStyles).forEach(([screenName, screenStyle]) => {
        finalStyles.push(screenStyle.mediaQuery + ' {\n' + screenStyle.rules.join('\n') + '\n}');
    });
      

    config.fileExtensions.forEach(extension => {
        config.directories.forEach(directory => {
            const files = getAllFilesInDir(directory, extension);
    
            files.forEach(filePath => {
                processFile(filePath);
            });
        });
    });

    const filteredStyles = [];
    const finalStyles = [];

    styleCSS.split('}').forEach(styleBlock => {
        const trimmedStyleBlock = styleBlock.trim();
        const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/);
        if (classNameMatch && classNameMatch[1]) {
          const className = classNameMatch[1];
          if (classNames.has(className)) {
            // Trim the style block and append '}' at the end
            filteredStyles.push(trimmedStyleBlock + '}');
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

    // Include screen styles
    finalStyles.push(...Object.values(screenStyles).map(style => style.join('\n')));


  writeOutputCSS(config.output, [...filteredStyles, ...finalStyles]);
}

if (process.argv[2] === 'watch') {
  console.log('Watching for file changes...');

  const watcher = chokidar.watch(config.directories, {
    ignored: /(^|[/\\])\../, // Ignore dotfiles
    persistent: true,
  });

  watcher.on('change', filePath => {
    console.log(`File changed: ${filePath}`);
    runBuildCommand();
  });

  process.on('SIGINT', () => {
    watcher.close();
    console.log('Watch process terminated.');
    process.exit();
  });

  runBuildCommand();
} else if (process.argv[2] === 'build') {
  runBuildCommand();
}
