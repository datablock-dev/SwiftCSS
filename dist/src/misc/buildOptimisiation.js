"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const getAllFilesInDir_1 = __importDefault(require("./getAllFilesInDir"));
function buildOptimisiation(styleObject, config) {
    const styleToBeCorrected = {};
    Object.keys(styleObject).forEach((style) => {
        const currSet = styleObject[style];
        const attributeCounter = {};
        currSet.forEach(({ attribute, cssAttributes }) => {
            const attributeArray = attribute.split(' '); // Unsorted array
            const sortedArray = attribute.split(' ').sort();
            if (attributeCounter[sortedArray.join(' ')]) {
                attributeCounter[sortedArray.join(' ')].add(attributeArray.join(' '));
            }
            else {
                attributeCounter[sortedArray.join(' ')] = new Set;
                attributeCounter[sortedArray.join(' ')].add(attributeArray.join(' '));
            }
        });
        Object.keys(attributeCounter).forEach((key) => {
            if (attributeCounter[key].size > 1) {
                attributeCounter[key].forEach((item) => {
                    if (item !== key) {
                        styleToBeCorrected[item] = key;
                    }
                });
            }
        });
    });
    // If we have classes/styling to be fixed, we pass it to the 
    // classFixer function
    if (Object.keys(styleToBeCorrected).length > 0) {
        classFixer(styleToBeCorrected, config);
    }
}
exports.default = buildOptimisiation;
function classFixer(styleToBeCorrected, config) {
    /*
        We get all file extensions that are specified in the config file
        and we then go through each directory and look for files endind with the
        extensions that was provided in the config file.
    */
    config.fileExtensions.forEach((extension) => {
        config.directories.forEach((directory) => {
            const files = (0, getAllFilesInDir_1.default)(directory, extension);
            // Process all files
            files.forEach(filePath => {
                const file = fs_1.default.readFileSync(filePath, 'utf-8');
                let fileContent = file;
                Object.keys(styleToBeCorrected).forEach((key) => {
                    const searchString = key;
                    const correctedString = styleToBeCorrected[key];
                    fileContent = fileContent.replace(searchString, correctedString);
                });
                if (fileContent !== file) {
                    fs_1.default.writeFileSync(filePath, fileContent);
                }
            });
        });
    });
}
