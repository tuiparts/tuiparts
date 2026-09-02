#!/bin/bash
#
# link-dev.sh - Development linking script for @opentui-ui/dialog
#
# This script creates a symbolic link (or copy) of the @opentui-ui/dialog package
# into another project's node_modules directory for local development and testing.
#
# Usage:
#   ./scripts/link-dev.sh <target-project-root> [options]
#
# Arguments:
#   <target-project-root>  Path to the project where you want to link this package
#
# Options:
#   --dist    Link the dist/ directory instead of the source root
#             Use this when testing the built package output
#   --copy    Copy files instead of creating symlinks (requires --dist)
#             Useful for scenarios where symlinks don't work (e.g., Docker volumes)
#
# Examples:
#   # Link source for active development with hot-reload
#   ./scripts/link-dev.sh /path/to/your/project
#
#   # Link built dist directory for testing production builds
#   ./scripts/link-dev.sh /path/to/your/project --dist
#
#   # Copy dist directory (useful for containerized environments)
#   ./scripts/link-dev.sh /path/to/your/project --dist --copy
#
# Notes:
#   - Target project must have node_modules directory (run bun/npm install first)
#   - Use --dist when you need to test the actual build output
#   - Use --copy with --dist when symlinks aren't supported in your environment
#

set -e

LINK_DIST=false
COPY_MODE=false
TARGET_ROOT=""

while [[ $# -gt 0 ]]; do
	case $1 in
	--dist)
		LINK_DIST=true
		shift
		;;
	--copy)
		COPY_MODE=true
		shift
		;;
	*)
		TARGET_ROOT="$1"
		shift
		;;
	esac
done

if [ -z "$TARGET_ROOT" ]; then
	echo "Usage: $0 <target-project-root> [--dist] [--copy]"
	echo "Example: $0 /path/to/your/project"
	echo "Example: $0 /path/to/your/project --dist"
	echo "Example: $0 /path/to/your/project --dist --copy"
	echo ""
	echo "Options:"
	echo "  --dist    Link dist directory instead of source"
	echo "  --copy    Copy dist directory instead of symlinking (requires --dist)"
	exit 1
fi

if [ "$COPY_MODE" = true ] && [ "$LINK_DIST" = false ]; then
	echo "Error: --copy requires --dist to be specified"
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE_MODULES_DIR="$TARGET_ROOT/node_modules"

if [ ! -d "$TARGET_ROOT" ]; then
	echo "Error: Target project root directory does not exist: $TARGET_ROOT"
	exit 1
fi

if [ ! -d "$NODE_MODULES_DIR" ]; then
	echo "Error: node_modules directory does not exist: $NODE_MODULES_DIR"
	echo "Please run 'bun install' or 'npm install' in the target project first."
	exit 1
fi

echo "Linking @opentui-ui/dialog from: $REPO_ROOT"
echo "To node_modules in: $NODE_MODULES_DIR"
echo

remove_if_exists() {
	local path="$1"
	if [ -e "$path" ]; then
		echo "Removing existing: $path"
		rm -rf "$path"
	fi
}

link_or_copy() {
	local source_path="$1"
	local target_path="$2"
	local package_name="$3"

	if [ "$COPY_MODE" = true ]; then
		cp -r "$source_path" "$target_path"
		echo "✓ Copied $package_name"
	else
		ln -s "$source_path" "$target_path"
		echo "✓ Linked $package_name"
	fi
}

# Determine path suffix and message
if [ "$LINK_DIST" = true ]; then
	SUFFIX="/dist"
	if [ "$COPY_MODE" = true ]; then
		echo "Copying dist directory..."
	else
		echo "Creating symbolic link (using dist directory)..."
	fi
else
	SUFFIX=""
	echo "Creating symbolic link..."
fi

# Link @opentui-ui/dialog
remove_if_exists "$NODE_MODULES_DIR/@opentui-ui/dialog"
PACKAGE_PATH="$REPO_ROOT$SUFFIX"
if [ -d "$PACKAGE_PATH" ]; then
	link_or_copy "$PACKAGE_PATH" "$NODE_MODULES_DIR/@opentui-ui/dialog" "@opentui-ui/dialog"
else
	echo "Warning: $PACKAGE_PATH not found"
fi

echo
echo "Development linking complete!"