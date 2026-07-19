// Recipes import "./use-theme", which exists only post-install (the theme
// recipe's react.tsx installs as components/ui/use-theme). This shim, merged
// into the recipe directories via rootDirs, points that import at the real
// source so the React recipes typecheck in-repo. Never shipped.
export * from "../../theme/react";
