#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const build_1 = __importDefault(require("./src/cli/build"));
//const cpus = os.cpus()
//const numThreads = cpus.length;
//console.log(numThreads) 
const configFile = path_1.default.join(process.cwd(), 'swiftcss.config.js');
// Gets all available pre-defined styles/classes that can be used
const styleCSS = fs_1.default.readFileSync(path_1.default.join(__dirname, 'src', 'style.css'), 'utf-8');
const defaultConfig = {
    fileExtensions: ['html', 'js', 'jsx', 'ts', 'tsx'],
    directories: ['./src'],
    input: '',
    output: './output.css',
};
// Have the init command recognition in the beginning to allow user to create the config file
// without triggering errors in the coming steps
if (process.argv[2] === "init") {
    const configContent = `module.exports = {
        fileExtensions: ["html","js","jsx","ts","tsx"],
        directories: ["./src"], // Specify directories to scan for style changes
        input: "", // Specify an input file to be appended into the output file
        output: "./output.css", // Specify the path to where the output file will be generated
        screens: { // specify media query cut-offs
            sd: {max: 600},
            md: {min: 600, max: 1200},
            ld: {min: 1200},
        }
    };`;
    fs_1.default.writeFileSync(configFile, configContent);
    console.log(`Configuration file created at ${configFile}`);
    process.exit(0);
}
// Load configuration
let config;
const directories = new Array;
if (fs_1.default.existsSync(configFile)) {
    // Since the file exists we assume the type to be of Config
    config = require(path_1.default.resolve(configFile));
    if (config.directories.length === 0) {
        console.error('Configuration file is missing values in directories. Please specify a directory so the CLI can start scanning.');
        process.exit(1);
    }
    else if (!fs_1.default.existsSync(path_1.default.dirname(path_1.default.join(process.cwd(), config.output)))) {
        console.error('Please specify a valid directory path for your output file in swiftcss.config.js.');
        process.exit(1);
    }
    else if (config.output === "") {
        console.error('Please specify a valid path for your output file in swiftcss.config.js.');
        process.exit(1);
    }
}
else {
    console.error('Configuration file not found. Run "init" command first.');
    process.exit(1);
}
let currentScreens = config.screens;
// Check if directories exist
for (const directory of config.directories) {
    if (!fs_1.default.existsSync(path_1.default.join(process.cwd(), directory))) {
        console.error(`Directory not found: ${directory}`);
        process.exit(1);
    }
    else {
        directories.push(path_1.default.join(process.cwd(), directory));
    }
}
// Update directories & output
config.directories = directories;
config.output = path_1.default.join(process.cwd(), config.output);
config.input = path_1.default.join(process.cwd(), config.input);
const classNames = new Set();
const dynamicClassNames = new Set();
const dynamicStyles = new Set();
const dynamicClasses = new Object;
const lightStyles = new Object;
const darkStyles = new Object;
const screenKeys = new Array;
// We define the commands here and the actions that occurrs for each command
if (process.argv[2] === 'watch') {
    console.log('Watching for file changes...');
    const baseStyle = new Object;
    styleCSS.split('}').forEach((styleBlock, i) => {
        const trimmedStyleBlock = styleBlock.trim();
        try {
            const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/); // Class Name without the leading "."
            const classAttribute = trimmedStyleBlock.split('{')[1].trim();
            if (classNameMatch) {
                const className = classNameMatch[1];
                // @ts-ignore
                baseStyle[className] = classAttribute;
            }
        }
        catch (error) { }
    });
    const watcher = chokidar_1.default.watch(config.directories, {
        ignored: /(^|[/\\])\../,
        persistent: true,
        // @ts-ignore
        depth: "infinity"
    });
    // Watch for changes in config file
    const configWatcher = chokidar_1.default.watch(configFile, { persistent: true });
    configWatcher.on('change', () => {
        const newConfig = require('./swiftcss.config.js');
        if (JSON.stringify(newConfig.screens) !== JSON.stringify(currentScreens)) {
            currentScreens = newConfig.screens;
            console.log(`Current Screens: ${currentScreens}`);
        }
        console.log('Compiler stopped due to changes to the config file, please rerun your command once you have finished editing the config file');
        process.exit();
    });
    screenKeys.push(...Object.keys(config.screens));
    watcher.on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        startLoadingAnimation();
        (0, build_1.default)('watch', styleCSS, config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
        stopLoadingAnimation();
        console.log('Changes generated');
    });
    process.on('SIGINT', () => {
        watcher.close();
        console.log('Watch process terminated.');
        process.exit();
    });
    (0, build_1.default)('watch', styleCSS, config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
}
else if (process.argv[2] === 'build') {
    const baseStyle = new Object;
    styleCSS.split('}').forEach((styleBlock, i) => {
        const trimmedStyleBlock = styleBlock.trim();
        try {
            const classNameMatch = trimmedStyleBlock.match(/\.([a-zA-Z0-9_-]+)\s*\{/); // Class Name without the leading "."
            const classAttribute = trimmedStyleBlock.split('{')[1].trim();
            if (!classNameMatch)
                return;
            const className = classNameMatch[1];
            //@ts-ignore
            baseStyle[className] = classAttribute;
        }
        catch (error) { }
    });
    (0, build_1.default)('build', styleCSS, config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles, screenKeys, baseStyle);
}
// Create a loading animation
let animationInterval;
const loadingSymbols = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let animationIndex = 0;
function startLoadingAnimation() {
    animationInterval = setInterval(() => {
        process.stdout.write('\r'); // Move cursor to the beginning of the line
        process.stdout.write(loadingSymbols[animationIndex]);
        animationIndex = (animationIndex + 1) % loadingSymbols.length;
    }, 100);
}
function stopLoadingAnimation() {
    clearInterval(animationInterval);
    process.stdout.write('\n'); // Move to the next line
}
