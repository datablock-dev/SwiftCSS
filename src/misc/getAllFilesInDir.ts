import fs from 'fs'
import path from 'path'

/*
  The following function find all files that exists across the 
*/
export default function getAllFilesInDir(dir: string, ext: string, fileList = new Array) {
    const files = fs.readdirSync(dir);

    files.forEach((file: string) => {
        const filePath = path.join(dir, file) as string;
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