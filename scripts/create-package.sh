#!/bin/bash

# Bootstrap a new package in the tuiparts monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get package name from argument or prompt
if [ -z "$1" ]; then
  echo -e "${BLUE}Enter package name (e.g., button, modal, tooltip):${NC}"
  read -r PACKAGE_NAME
else
  PACKAGE_NAME="$1"
fi

# Validate package name
if [ -z "$PACKAGE_NAME" ]; then
  echo -e "${RED}Error: Package name is required${NC}"
  exit 1
fi

# Convert to lowercase and remove spaces
PACKAGE_NAME=$(echo "$PACKAGE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

PACKAGE_DIR="packages/$PACKAGE_NAME"

# Check if package already exists
if [ -d "$PACKAGE_DIR" ]; then
  echo -e "${RED}Error: Package '$PACKAGE_NAME' already exists${NC}"
  exit 1
fi

echo -e "${BLUE}Creating package: @tuiparts/$PACKAGE_NAME${NC}"

# Create directory structure
mkdir -p "$PACKAGE_DIR/src"
mkdir -p "$PACKAGE_DIR/examples"

# Create package.json
cat > "$PACKAGE_DIR/package.json" << EOF
{
  "name": "@tuiparts/$PACKAGE_NAME",
  "version": "0.0.1",
  "description": "A $PACKAGE_NAME component for terminal UIs built on OpenTUI",
  "author": "Matt Simpson",
  "license": "MIT",
  "sideEffects": false,
  "repository": {
    "type": "git",
    "url": "git+https://github.com/msmps/tuiparts.git",
    "directory": "packages/$PACKAGE_NAME"
  },
  "type": "module",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    }
  },
  "bugs": {
    "url": "https://github.com/msmps/tuiparts/issues"
  },
  "files": [
    "dist"
  ],
  "homepage": "https://github.com/msmps/tuiparts#readme",
  "keywords": [
    "$PACKAGE_NAME",
    "tui",
    "terminal",
    "cli",
    "opentui"
  ],
  "scripts": {
    "build": "tsdown",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@opentui/core": "^0.1.63",
    "@types/bun": "latest",
    "tsdown": "^0.18.2",
    "typescript": "^5"
  },
  "peerDependencies": {
    "@opentui/core": "^0.1.63"
  }
}
EOF

# Create tsconfig.json
cat > "$PACKAGE_DIR/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF

# Create tsdown.config.ts
cat > "$PACKAGE_DIR/tsdown.config.ts" << EOF
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["@opentui/core"],
});
EOF

# Create src/index.ts
cat > "$PACKAGE_DIR/src/index.ts" << EOF
// $PACKAGE_NAME component for OpenTUI
// TODO: Implement your component here

export const $PACKAGE_NAME = () => {
  // Implementation
};
EOF

# Create README.md
cat > "$PACKAGE_DIR/README.md" << EOF
# @tuiparts/$PACKAGE_NAME

A $PACKAGE_NAME component for terminal UIs built on OpenTUI.

## Installation

\`\`\`bash
bun add @tuiparts/$PACKAGE_NAME
\`\`\`

## Usage

\`\`\`typescript
import { $PACKAGE_NAME } from "@tuiparts/$PACKAGE_NAME";

// TODO: Add usage example
\`\`\`

## License

MIT
EOF

echo -e "${GREEN}Package created successfully at $PACKAGE_DIR${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. cd $PACKAGE_DIR"
echo "  2. Implement your component in src/index.ts"
echo "  3. Run 'bun install' from the root to link dependencies"
echo "  4. Run 'bun run build' to build the package"
