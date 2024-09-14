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
else
  echo "Usage: ./run install"
  exit 1
fi
