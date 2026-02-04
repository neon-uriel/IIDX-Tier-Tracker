#!/bin/bash

# Configuration
BACKEND_DIR="backend"
IMPORT_SCRIPT="src/services/dataImportService.js"

echo "Starting to fetch all songs (Level 1-12, SP/DP)..."

# Move to backend directory to ensure dependencies and .env are found
cd "$BACKEND_DIR"

# Loop through levels 1 to 12
for level in {1..12}
do
  echo "------------------------------------------"
  echo "Fetching songs for Level $level..."
  node "src/services/dataImportService.js" "$level"
  
  if [ $? -eq 0 ]; then
    echo "Level $level completed successfully."
  else
    echo "Error occurred during Level $level fetching."
  fi
done

cd ..

echo "------------------------------------------"
echo "All songs have been fetched and imported into the database."
