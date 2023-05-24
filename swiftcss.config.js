module.exports = {
        fileExtensions: ["html","js","jsx","ts","tsx"],
        directories: ["./test"], // Specify directories to scan for style changes
        input: "./input.css", // Specify an input file to be appended into the output file
        output: "./output.css", // Specify the path to where the output file will be generated
        screens: { // specify media querie cut-offs
            sd: {max: 600},
            md: {min: 600, max: 1200},
            ld: {min: 1200},
        }
    };