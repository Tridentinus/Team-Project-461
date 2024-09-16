#!/bin/bash

# Check if the argument is 'install'
if [ "$1" == "install" ]; then
  echo "Installing dependencies..."
  npm install
  if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully."
    exit 0
  else
    echo "Failed to install dependencies."
    exit 1
  fi
fi

if [ "$1" == "test" ]; then
  echo "Running tests..."
  npm run test
  if [ $? -eq 0 ]; then
    echo "Running tests ..."
    exit 0
  else
    echo "Tests failed."
    exit 1
  fi
fi

echo "Running tests..."
node dist/index.js "$1"