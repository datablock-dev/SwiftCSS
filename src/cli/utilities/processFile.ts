import parseClassNamesFromHTML from "@cli/parseClass";
import { generateMediaQuries } from "@parsers/mediaQueries";

// Types
import { BaseStyle, Config, DynamicClasses, modeStyle } from "types";

export interface ProcessFile {
    filePath: string
    config: Config
    screenKeys: []
    dynamicClasses: DynamicClasses
    darkStyles: modeStyle
    lightStyles: modeStyle
    pseudoClasses: []
    mediaQueries: []
    baseStyle: BaseStyle
}

export default function processFile({
    filePath, 
    config, 
    screenKeys, 
    dynamicClasses, 
    darkStyles, 
    lightStyles, 
    pseudoClasses, 
    mediaQueries
}: ProcessFile) {
    
    
    const { 
        classNames: fileClassNames, 
        dynamicClassNames: fileDynamicClassNames, 
        modeAttributes: attributes, 
        screenClasses: screenStyles, 
        pseudoClasses: pseudoClass 
    } = parseClassNamesFromHTML(config, filePath, screenKeys);

    // @ts-ignore
    fileClassNames.forEach((className: string) => classNames.add(className));
    Object.entries(fileDynamicClassNames).forEach(([className, classProperties]: any[string]) => {
      // className -> bg-[#000], classProprety -> { property: "fill", value: #bg }
      dynamicClasses[className as keyof DynamicClasses] = classProperties;
    });

    /************************** Mode Styling **************************/
    // This loop goes through all attributes for each of the mode styling (light or dark)
    Object.entries(attributes).forEach(([attributeName, attributeValues]: any[string]) => {
      // attributeName -> style-dark or style-light
      // attributeValues -> [bg-[#fff], fs-14] etc.
      attributeValues.forEach((attributeValue: string) => {
        //console.log(attributeValue.split(' '))



        if (attributeName === 'style-dark') {
          if (!darkStyles[attributeValue as keyof modeStyle]) {
            // Create new key with an empty array
            darkStyles[attributeValue] = new Array;
          }
          if (!darkStyles[attributeValue as keyof modeStyle].includes(attributeValue)) {
            //console.log(attributeValue)
            darkStyles[attributeValue].push(attributeValue);
          }
        }

        if (attributeName === 'style-light') {
          if (!lightStyles[attributeValue]) {
            lightStyles[attributeValue] = new Array;
          }
          if (!lightStyles[attributeValue].includes(attributeValue)) {
            lightStyles[attributeValue].push(attributeValue);
          }
        }
      });
    });

    // Push pseudo classes of a specific file to the array of all pseudo classes
    //console.log(pseudoClasses)
    pseudoClasses.push(...pseudoClass)

    const mediaObject = generateMediaQuries(config.screens, screenStyles, finalStyles, styleCSS, baseStyle)
    mediaQueries.push(...mediaObject)
  };