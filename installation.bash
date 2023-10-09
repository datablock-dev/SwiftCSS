#!/bin/bash

# Run npm install
tsc

# Copy style.css from src to dist/src
cp src/style.css dist/src/style.css