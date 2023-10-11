import fs from 'fs';
import { AttributeObject } from "src/cli/funnel"
import { Config } from "types"
import getAllFilesInDir from "./getAllFilesInDir"

interface AttributeCounter {
    [key: string]: Set<string>
}
interface StyleToBeCorrected {
    [key: string]: string
}

export default function buildOptimisiation(styleObject: AttributeObject, config: Config) {
    const styleToBeCorrected: StyleToBeCorrected = {}

    Object.keys(styleObject).forEach((style) => {
        const currSet = styleObject[style]

        const attributeCounter: AttributeCounter = {};

        currSet.forEach(({ attribute, cssAttributes }) => {
            const attributeArray = attribute.split(' ') // Unsorted array
            const sortedArray = attribute.split(' ').sort()

            if (attributeCounter[sortedArray.join(' ')]) {
                attributeCounter[sortedArray.join(' ')].add(attributeArray.join(' '))
            } else {
                attributeCounter[sortedArray.join(' ')] = new Set;
                attributeCounter[sortedArray.join(' ')].add(attributeArray.join(' '))
            }
        })

        Object.keys(attributeCounter).forEach((key) => {
            if (attributeCounter[key].size > 1) {
                attributeCounter[key].forEach((item) => {
                    if (item !== key) {
                        styleToBeCorrected[item] = key
                    }
                })
            }
        })
    })

    // If we have classes/styling to be fixed, we pass it to the 
    // classFixer function
    if (Object.keys(styleToBeCorrected).length > 0) {
        classFixer(styleToBeCorrected, config)
    }
}

function classFixer(styleToBeCorrected: StyleToBeCorrected, config: Config) {

    /*
        We get all file extensions that are specified in the config file
        and we then go through each directory and look for files endind with the
        extensions that was provided in the config file.
    */
    config.fileExtensions.forEach((extension: string) => {
        config.directories.forEach((directory: string) => {
            const files = getAllFilesInDir(directory, extension);
            // Process all files
            files.forEach(filePath => {
                const file = fs.readFileSync(filePath, 'utf-8');
                let fileContent = file

                Object.keys(styleToBeCorrected).forEach((key) => {
                    const searchString = key;
                    const correctedString = styleToBeCorrected[key];

                    fileContent = fileContent.replace(searchString, correctedString)
                })

                if(fileContent !== file){
                    fs.writeFileSync(filePath, fileContent)
                }
            });
        });
    });
}