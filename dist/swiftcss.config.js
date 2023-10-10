"use strict";
module.exports = {
    fileExtensions: ["html", "js", "jsx", "ts", "tsx"],
    directories: ["./test"],
    input: ["./input.css", './input2.css'],
    output: "./output.css",
    screens: {
        sd: { max: 600 },
        md: { min: 600, max: 1200 },
        ld: { min: 1200 },
    }
};
