#!/usr/bin/env node

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const config = require('./smooth.config.js'); // Import the config file

let matchedClasses = [];

const cssPath = path.join(__dirname, 'style.css'); // Path to your CSS file
const outputPath = path.join(__dirname, config.output); // Path to the output CSS file

const processFile = async (filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const fileContents = await fs.promises.readFile(resolvedPath, 'utf-8');
    const processedContents = processFileContents(fileContents);
    matchedClasses = Array.from(new Set([...matchedClasses, ...processedContents]));
    removeUnusedClasses(matchedClasses);
    const updatedCSS = updateCSS(cssPath, matchedClasses);
    await fs.promises.writeFile(outputPath, updatedCSS, 'utf-8');
    console.log('CSS successfully updated.');
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
};

const watchFiles = async () => {
    console.log('Watching changes in files...');
  
    const watcher = chokidar.watch(config.directories, {
      ignored: /node_modules/,
      persistent: true,
      cwd: path.dirname(__filename), // Set the current working directory for watcher
      depth: Infinity, // Include subdirectories
      awaitWriteFinish: {
        stabilityThreshold: 500, // Wait for 500ms after the last change
        pollInterval: 100, // Check for changes every 100ms
      },
    });
  
    // Process all existing files initially
    const files = await getFilesToProcess(config.directories);
    await Promise.all(files.map(processFile));
  
    watcher.on('add', async (filePath) => {
      await processFile(filePath);
    });
  
    watcher.on('change', async (filePath) => {
      await processFile(filePath);
    });
  };
  
  const getFilesToProcess = async (directories) => {
    const files = [];
    for (const directory of directories) {
      const dirPath = path.join(__dirname, directory);
      const stats = await fs.promises.stat(dirPath);
      if (stats.isDirectory()) {
        const dirFiles = await getAllFiles(dirPath);
        files.push(...dirFiles);
      } else {
        files.push(dirPath);
      }
    }
    return files;
  };
  
  const getAllFiles = async (dirPath) => {
    const files = [];
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
    return files;
  };

const processFileContents = (fileContents) => {
  const attributeRegex = /(?:class(?:Name)?|style-dark)="([^"]*)"/g;
  const classes = fileContents.match(attributeRegex);
  if (!classes) {
    return [];
  }
  const classList = classes
    .map((cls) => cls.match(/(["'])(.*?)\1/)[2].split(' '))
    .flat();
  return classList;
};

const updateCSS = (cssPath, matchedClasses) => {
  const existingCSS = fs.readFileSync(cssPath, 'utf-8');

  const newCSS = matchedClasses
    .map((className) => {
      const regex = new RegExp(`\\.${className}\\s*{[^}]+}`, 'g');
      const match = existingCSS.match(regex);
      return match ? match.join('') : '';
    })
    .join('');

  return newCSS;
};

const removeUnusedClasses = (cssPath, matchedClasses) => {
  const existingCSS = fs.readFileSync(cssPath, 'utf-8');

  const unusedClassesRegex = /\.([^\s{]+)(?![^{]*})/g;
  const unusedClasses = existingCSS.match(unusedClassesRegex) || [];

  const cleanedCSS = unusedClasses.reduce((css, className) => {
    if (!matchedClasses.includes(className)) {
      const regex = new RegExp(`\\.${className}\\s*{[^}]+}`, 'g');
      return css.replace(regex, '');
    }
    return css;
  }, existingCSS);

  fs.writeFileSync(cssPath, cleanedCSS, 'utf-8');
};

// Define the 'watch' command
yargs.command('watch', 'Watch files and process smoothstyles', {}, watchFiles);

// Parse command-line arguments
yargs.parse();
