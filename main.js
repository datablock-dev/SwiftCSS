#!/usr/bin/env node

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const config = require('./smooth.config.js'); // Import the config file

// Functions
const dynamicClasses = require('./dynamicClasses.js');

let matchedClasses = [];

const cssPath = path.join(__dirname, 'style.css'); // Path to your CSS file
const outputPath = path.join(__dirname, config.output); // Path to the output CSS file

const watchFiles = async () => {
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

  console.log('Watching changes in files...');

  watcher.on('add', async (filePath) => {
    await processFile(filePath);
  });

  watcher.on('change', async (filePath) => {
    await processFile(filePath);
  });
};

const processFile = async (filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const fileContents = await fs.promises.readFile(resolvedPath, 'utf-8');
    // Gets all classNames found
    const processedContents = processFileContents(fileContents);

    // Copy contents from config.input if provided and it's a CSS file
    if (config.input && config.input.endsWith('.css')) {
      const inputPath = path.join(__dirname, config.input);
      const inputContents = await fs.promises.readFile(inputPath, 'utf-8');
      // Adds all content in input file to the beginning
      processedContents.unshift(inputContents);
    }

    matchedClasses = Array.from(new Set([...matchedClasses, ...processedContents]));
    matchedClasses = removeUnusedClasses(matchedClasses); // Update matchedClasses with filtered list
    const updatedCSS = await updateCSS(cssPath, matchedClasses);
    await fs.promises.writeFile(outputPath, updatedCSS, 'utf-8');

    const dynamicClassRegex = /-\[(#(?:[0-9a-fA-F]{3}){1,2})\]/;
    const dynamicMatches = processedContents.filter((className) => dynamicClassRegex.test(className));

    // If we find a dynamic class in any of the files
    if(dynamicMatches.length > 0){
        dynamicClasses(dynamicMatches, cssPath, outputPath);
    }

    console.log('CSS successfully updated.');
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
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

const updateCSS = async (cssPath, matchedClasses) => {
  let existingCSS = '';

  // Get style from base style (style.css)
  if (fs.existsSync(cssPath)) {
    existingCSS = await fs.promises.readFile(cssPath, 'utf-8');
  }

  const newCSS = matchedClasses
    .map((className) => {
      const regex = new RegExp(`\\.${className}\\s*{[^}]+}`, 'g');
      const match = existingCSS.match(regex);
      return match ? match.join('') : '';
    })
    .join('');

  // Add contents from config.input if provided and it's a CSS file
  if (config.input && config.input.endsWith('.css')) {
    const inputPath = path.join(__dirname, config.input);
    const inputContents = await fs.promises.readFile(inputPath, 'utf-8');
    return inputContents + newCSS;
  }

  return newCSS;
};

const removeUnusedClasses = (matchedClasses) => {
  const existingCSS = fs.readFileSync(cssPath, 'utf-8');
  const unusedClassesRegex = /\.([^\s{]+)(?![^{]*})/g;
  const unusedClasses = existingCSS.match(unusedClassesRegex) || [];
  return matchedClasses.filter((className) => !unusedClasses.includes(className));
};

// Define the 'watch' command
yargs.command('watch', 'Watch files and process smoothstyles', {}, watchFiles);

// Parse command-line arguments
yargs.parse();
