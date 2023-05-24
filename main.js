#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const runBuildCommand = require('./src/cli/build');

const configFile = path.join(process.cwd(), 'swiftcss.config.js');

const styleCSS = fs.readFileSync('./src/style.css', 'utf-8');
const defaultConfig = {
    fileExtensions: ['html', 'js', 'jsx', 'ts', 'tsx'],
    directories: ['./src'],
    input: '',
    output: './output.css',
};

// Load configuration
let config;
const directories = []
if (fs.existsSync(configFile)) {
    config = require(path.resolve(configFile));
    if(config.directories.length === 0){
        console.error('Configuration file is missing values in directories. Please specify a directory so the CLI can start scanning.');    
        process.exit(1);
    } else if(!fs.existsSync(path.join(process.cwd(), config.output))){
        console.error('Please specify a path to your output file (e.g. output: "./output.css") in swiftcss.config.js to output CSS.');    
        process.exit(1);
    }
} else {
    console.error('Configuration file not found. Run "init" command first.');
    process.exit(1);
}

let currentScreens = configFile.screens;


// Check if directories exist
for (const directory of config.directories) {
  if (!fs.existsSync(path.join(process.cwd(), directory))) {
    console.error(`Directory not found: ${directory}`);
    process.exit(1);
  } else {
    directories.push(path.join(process.cwd(), directory))
  }
}

// Update directories & output
config.directories = directories
config.output = path.join(process.cwd(), config.output)
config.input = path.join(process.cwd(), config.input)



const classNames = new Set();
const dynamicClassNames = new Set();
const dynamicStyles = new Set();
const dynamicClasses = {};
const lightStyles = {}; 
const darkStyles = {};
const screenKeys = [];

if (process.argv[2] === 'watch') {
  console.log('Watching for file changes...');

    const baseStyle = new Object;
    styleCSS.split('}').forEach((styleBlock, i) => {
        const trimmedStyleBlock = styleBlock.trim();
        try {
            const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/); // Class Name without the leading "."
            const classAttribute = trimmedStyleBlock.split('{')[1].trim()
            const className = classNameMatch[1]
            baseStyle[className] = classAttribute
        } catch (error) {}
    });
  
    const watcher = chokidar.watch(config.directories, {
      ignored: /(^|[/\\])\../, // Ignore dotfiles
      persistent: true,
      depth: "infinity"
    });
    
    // Watch for changes in config file
    const configWatcher = chokidar.watch(configFile, { persistent: true });
    configWatcher.on('change', path => {
        const newConfig = require('./swiftcss.config.js');
        if (JSON.stringify(newConfig.screens) !== JSON.stringify(currentScreens)) {
            currentScreens = newConfig.screens;
            console.log(currentScreens)
        }
        console.log('Compiler stopped due to changes to the config file, please rerun your command once you have finished editing the config file');
        process.exit();
    });

    screenKeys.push(...Object.keys(config.screens))
    
    watcher.on('change', filePath => {
        console.log(`File changed: ${filePath}`);
        runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
    });

    process.on('SIGINT', () => {
      watcher.close();
      console.log('Watch process terminated.');
      process.exit();
    });

    runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
} else if (process.argv[2] === 'build') {
    const baseStyle = new Object;
    styleCSS.split('}').forEach((styleBlock, i) => {
        const trimmedStyleBlock = styleBlock.trim();
        try {
            const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/); // Class Name without the leading "."
            const classAttribute = trimmedStyleBlock.split('{')[1].trim()
            const className = classNameMatch[1]
            baseStyle[className] = classAttribute
        } catch (error) {}
    });
    runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
} else if(process.argv[2] === "init"){
    const configContent = `module.exports = {
        fileExtensions: ["html","js","jsx","ts","tsx"],
        directories: ["./src"], // Specify directories to scan for style changes
        input: "", // Specify an input file to be appended into the output file
        output: "./output.css", // Specify the path to where the output file will be generated
        screens: { // specify media querie cut-offs
            sd: {max: 600},
            md: {min: 600, max: 1200},
            ld: {min: 1200},
        }
    };`;
      
    fs.writeFileSync(configFile, configContent);
    console.log(`Configuration file created at ${configFile}`);
    process.exit(0);
}
