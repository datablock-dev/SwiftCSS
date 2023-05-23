const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const runBuildCommand = require('./src/cli/build');

const configFile = 'swiftstyle.config.js';
let currentScreens = require('./swiftstyle.config.js').screens;
const defaultConfig = {
  fileExtensions: ['html', 'js', 'jsx', 'ts', 'tsx'],
  directories: ['./src'],
  input: '',
  output: './output.css',
};

// Load configuration
let config;
if (fs.existsSync(configFile)) {
  config = require(path.resolve(configFile));
} else {
  console.error('Configuration file not found. Run "init" command first.');
  process.exit(1);
}

// Check if directories exist
for (const directory of config.directories) {
  if (!fs.existsSync(directory)) {
    console.error(`Directory not found: ${directory}`);
    process.exit(1);
  }
}

const classNames = new Set();
const dynamicClassNames = new Set();
const dynamicStyles = new Set();
const dynamicClasses = {};
const lightStyles = {}; 
const darkStyles = {};

if (process.argv[2] === 'watch') {
  console.log('Watching for file changes...');

  const watcher = chokidar.watch(config.directories, {
    ignored: /(^|[/\\])\../, // Ignore dotfiles
    persistent: true,
    depth: "infinity"
  });

    const configWatcher = chokidar.watch(configFile, { persistent: true });
    configWatcher.on('change', path => {
        const newConfig = require('./swiftstyle.config.js');
        if (JSON.stringify(newConfig.screens) !== JSON.stringify(currentScreens)) {
            currentScreens = newConfig.screens;
            parseClass.updateStyles(currentScreens); // Your method to update the parseClass
        }
        console.log('Compiler stopped due to changes to the config file, please rerun your command once you have finished editing the config file');
        process.exit();
    });

  watcher.on('change', filePath => {
    console.log(`File changed: ${filePath}`);
    runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles);
  });

  process.on('SIGINT', () => {
    watcher.close();
    console.log('Watch process terminated.');
    process.exit();
  });

  runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles);
} else if (process.argv[2] === 'build') {
    runBuildCommand(config, classNames, dynamicClassNames, dynamicStyles, dynamicClasses, lightStyles, darkStyles);
}
