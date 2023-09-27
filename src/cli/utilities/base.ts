import fs from 'fs';
import { BaseStyle, Config } from "types";
import classParser from '../parsers_new/classParser';
import dynamicParser from '../parsers_new/dynamicParser';

export default function classCSS(classArray: string[], baseStyle: BaseStyle, config: Config){
    const finalBaseCSS = new Set();

    // Regex
    const dynamicStyleRegex = /-(?:\[([^\]]+)\])/g;
    const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    
    try{
        classArray.forEach((className) => {
            if(baseStyle[className]){
                var cssString = `.${className}{\n`

                baseStyle[className].forEach((e, i, arr) => {
                    if((i +1) === arr.length){
                        cssString += `\t${e};`;
                        cssString += '\n}'
                    } else if(i + 1 !== arr.length) {
                        cssString += `\t${e};\n`;
                    }
                })

                finalBaseCSS.add(cssString);
            } else {
                // Here, we will most likely have a dynamic class or pseudoclass

                // Parse pseudoClasses & pseudoElements
                if(className.includes(':') || className.includes('::')){
                    const parsedString = classParser(className, baseStyle)
                    if(parsedString){
                        const { className, cssAttribute, name, value, pseudo, pseudoSeparator } = parsedString

                        var cssString = `.${className}${pseudoSeparator}${pseudo}{\n`
                        
                        if(Array.isArray(cssAttribute)){
                            cssAttribute.forEach((e, i, arr) => {
                                if((i +1) === arr.length){
                                    cssString += `\t${e}`;
                                    cssString += '\n}'
                                } else if(i + 1 !== arr.length) {
                                    cssString += `\t${e}\n`;
                                }
                            })
                        } else {
                            cssString += `\t${cssAttribute}`
                            cssString += '\n}'
                        }

                        finalBaseCSS.add(cssString)                  
                    }
                }

                // Parse Dynamic Classes
                if(className.match(dynamicStyleRegex)){
                    const parsedString = dynamicParser(className);
                    if(parsedString){
                        const { className, cssAttribute, name, value } = parsedString
                        var cssString = `.${className}{\n`
                        
                        cssString += `\t${cssAttribute}`
                        cssString += '\n}'
                        
                        finalBaseCSS.add(cssString)
                    }
                }
            }
        })


    } catch(err) {
        console.log(`An error has occurred: ${err}`);
    }

    //console.log(finalBaseCSS);
    //console.log(config.output.replace('output.css', 'test.css'));
    const css = Array.from(finalBaseCSS).join('\n')
    
    return css;
}