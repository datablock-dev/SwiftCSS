module.exports = {
    fileExtensions: ["html","js","jsx","ts","tsx"],
    directories: ["./test"],
    input: "./input.css",
    output: "./output.css",
    screens: {
        sd: {max: 600},
        md: {min: 600, max: 1200},
        ld: {min: 1200, max: 1600},
        xl: {min: 1600, max: 2200},
        mxl: {min: 2200}
    }
};