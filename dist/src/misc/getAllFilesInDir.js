"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  The following function find all files that exists across the
*/
function getAllFilesInDir(dir, ext, fileList = new Array) {
    const files = fs_1.default.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            fileList = getAllFilesInDir(filePath, ext, fileList);
        }
        else {
            if (path_1.default.extname(file) === `.${ext}`) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}
exports.default = getAllFilesInDir;
