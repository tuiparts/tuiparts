#!/usr/bin/env bun

/** biome-ignore-all lint/suspicious/noArrayIndexKey: example */

/** @jsxImportSource @opentui/react */

/**
 * Async Prompt Methods Showcase
 *
 * A beautiful demonstration of all async dialog methods:
 * - confirm() - Yes/No decisions
 * - alert() - Notifications and acknowledgments
 * - choice() - Multiple option selection
 * - prompt() - User text input
 *
 * Run with: bun packages/dialog/examples/async-prompts.tsx
 */

import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import { useState } from "react";
import {
  type AlertContext,
  type ChoiceContext,
  type ConfirmContext,
  DialogProvider,
  type PromptContext,
  useDialog,
  useDialogKeyboard,
  useDialogState,
} from "../src/react";

// =============================================================================
// Color Palette (Catppuccin Mocha)
// =============================================================================

const colors = {
  // Backgrounds (layered from darkest to lightest)
  bgDark: "#1e1e2e", // darkBase - main canvas
  bgPanel: "#181825", // darkMantle - recessed panels (status bar, logs)
  bgHover: "#313244", // darkSurface0 - hover/selection states
  bgAccent: "#45475a", // darkSurface1 - elevated accent areas (rename dialog header)

  // Text hierarchy
  textPrimary: "#cdd6f4", // darkText - primary content
  textSecondary: "#bac2de", // darkSubtext1 - secondary content
  textMuted: "#6c7086", // darkOverlay0 - hints, disabled states

  // Semantic colors (Catppuccin pastels)
  green: "#a6e3a1", // darkGreen - success indicators, save actions
  greenBg: "#24312b", // diffAddedBg - success header bg (dark green-tinted)
  red: "#f38ba8", // darkRed - error/danger indicators, delete actions
  redBg: "#3c2a32", // diffRemovedBg - error header bg (dark red-tinted)
  yellow: "#f9e2af", // darkYellow - warning indicators
  yellowBg: "#45475a", // darkSurface1 - warning header bg (elevated surface, yellow icon conveys meaning)
  blue: "#89b4fa", // darkBlue - info, primary actions, input focus
  purple: "#585b70", // darkSurface2 - git dialog header (elevated, slightly purple-tinted)
  cyan: "#89dceb", // darkSky - keyboard hints, highlights
};

// =============================================================================
// Confirm Dialog - Delete File
// =============================================================================

export function DeleteConfirmDialog({
  resolve,
  dialogId,
  filename,
}: ConfirmContext & { filename: string }) {
  const [selected, setSelected] = useState<"cancel" | "delete">("cancel");

  useDialogKeyboard((key) => {
    if (key.name === "tab" || key.name === "left" || key.name === "right") {
      setSelected((prev) => (prev === "cancel" ? "delete" : "cancel"));
    }
    if (key.name === "return") {
      resolve(selected === "delete");
    }
    if (key.name === "escape") {
      resolve(false);
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg={colors.red}>*</text>
        <text fg={colors.textPrimary}>
          <b>Delete File</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={colors.textSecondary}>
          Are you sure you want to delete this file?
        </text>
        <text fg={colors.textPrimary}>→ {filename}</text>
        <text fg={colors.textMuted}>This action cannot be undone.</text>
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={2}
        justifyContent="flex-end"
      >
        <text
          bg={selected === "cancel" ? colors.bgHover : undefined}
          fg={colors.textSecondary}
        >
          {" "}
          Cancel{" "}
        </text>
        <text
          bg={selected === "delete" ? colors.redBg : undefined}
          fg={selected === "delete" ? "#ffffff" : colors.red}
        >
          {" "}
          Delete{" "}
        </text>
      </box>
    </box>
  );
}

// =============================================================================
// Alert Dialog - Success Notification
// =============================================================================

export function SuccessAlertDialog({
  dismiss,
  dialogId,
  message,
}: AlertContext & { message: string }) {
  useDialogKeyboard((key) => {
    if (key.name === "return" || key.name === "escape") {
      dismiss();
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.greenBg}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#ffffff">+</text>
        <text fg="#ffffff">
          <b>Success</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={colors.textPrimary}>{message}</text>
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        justifyContent="flex-end"
      >
        <text bg={colors.greenBg} fg="#ffffff">
          {" OK "}
        </text>
      </box>
    </box>
  );
}

// =============================================================================
// Alert Dialog - Error Notification
// =============================================================================

function ErrorAlertDialog({
  dismiss,
  dialogId,
  title,
  message,
}: AlertContext & { title: string; message: string }) {
  useDialogKeyboard((key) => {
    if (key.name === "return" || key.name === "escape") {
      dismiss();
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.redBg}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#ffffff">!</text>
        <text fg="#ffffff">
          <b>{title}</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={colors.textPrimary} wrapMode="word">
          {message}
        </text>
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        justifyContent="flex-end"
      >
        <text bg={colors.bgHover} fg={colors.textPrimary}>
          {" Dismiss "}
        </text>
      </box>
    </box>
  );
}

// =============================================================================
// Choice Dialog - Unsaved Changes
// =============================================================================

function UnsavedChangesDialog({
  resolve,
  dismiss,
  dialogId,
  filename,
}: ChoiceContext<"save" | "discard"> & { filename: string }) {
  const [selected, setSelected] = useState<"save" | "discard" | "cancel">(
    "save",
  );

  const options = ["save", "discard", "cancel"] as const;

  useDialogKeyboard((key) => {
    if (key.name === "tab" || key.name === "right") {
      const idx = options.indexOf(selected);
      setSelected(options[(idx + 1) % options.length]);
    }
    if (key.name === "left") {
      const idx = options.indexOf(selected);
      setSelected(options[(idx - 1 + options.length) % options.length]);
    }
    if (key.name === "return") {
      if (selected === "cancel") {
        dismiss();
      } else {
        resolve(selected);
      }
    }
    if (key.name === "escape") {
      dismiss();
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.yellowBg}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#ffffff">~</text>
        <text fg="#ffffff">
          <b>Unsaved Changes</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={colors.textSecondary}>
          Do you want to save changes to this file?
        </text>
        <text fg={colors.textPrimary}>→ {filename}</text>
        <text fg={colors.textMuted}>
          Your changes will be lost if you don't save them.
        </text>
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={2}
        justifyContent="flex-end"
      >
        <text
          bg={selected === "cancel" ? colors.bgHover : undefined}
          fg={colors.textSecondary}
        >
          {"  Cancel  "}
        </text>
        <text
          bg={selected === "discard" ? colors.redBg : undefined}
          fg={selected === "discard" ? "#ffffff" : colors.red}
        >
          {"  Discard  "}
        </text>
        <text
          bg={selected === "save" ? colors.greenBg : undefined}
          fg={selected === "save" ? "#ffffff" : colors.green}
        >
          {"  Save  "}
        </text>
      </box>
    </box>
  );
}

// =============================================================================
// Prompt Dialog - Rename File
// =============================================================================

function RenamePromptDialog({
  resolve,
  dismiss,
  dialogId,
  currentName,
}: PromptContext<string> & { currentName: string }) {
  const [value, setValue] = useState(currentName);
  const focused = true; // Always focused when dialog is open

  useDialogKeyboard((key) => {
    if (key.name === "return") {
      resolve(value);
    }
    if (key.name === "escape") {
      dismiss(); // Cancel without a value
    }
  }, dialogId);

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.bgAccent}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#ffffff">&gt;</text>
        <text fg="#ffffff">
          <b>Rename File</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={colors.textSecondary}>Enter new filename:</text>
        <box
          backgroundColor={colors.bgPanel}
          borderStyle="single"
          borderColor={focused ? colors.blue : colors.textMuted}
          height={3}
        >
          <input
            value={value}
            onInput={(val) => setValue(val)}
            focused={focused}
            focusedBackgroundColor="transparent"
          />
        </box>
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={2}
        justifyContent="flex-end"
      >
        <text fg={colors.textMuted}>ESC Cancel</text>
        <text bg={colors.bgAccent} fg="#ffffff">
          {" Rename "}
        </text>
      </box>
    </box>
  );
}

// =============================================================================
// Choice Dialog - Git Commit Options
// =============================================================================

function GitCommitDialog({
  resolve,
  dismiss,
  dialogId,
}: ChoiceContext<"commit" | "stash" | "reset">) {
  const [selected, setSelected] = useState<
    "commit" | "stash" | "reset" | "cancel"
  >("commit");

  const options = ["commit", "stash", "reset", "cancel"] as const;

  useDialogKeyboard((key) => {
    if (key.name === "tab" || key.name === "down") {
      const idx = options.indexOf(selected);
      setSelected(options[(idx + 1) % options.length]);
    }
    if (key.name === "up") {
      const idx = options.indexOf(selected);
      setSelected(options[(idx - 1 + options.length) % options.length]);
    }
    if (key.name === "return") {
      if (selected === "cancel") {
        dismiss();
      } else {
        resolve(selected);
      }
    }
    if (key.name === "escape") {
      dismiss();
    }
  }, dialogId);

  const optionData = [
    {
      key: "commit",
      icon: "+",
      label: "Commit changes",
      desc: "Create a new commit with staged changes",
      color: colors.green,
    },
    {
      key: "stash",
      icon: "~",
      label: "Stash changes",
      desc: "Save changes for later and clean working directory",
      color: colors.yellow,
    },
    {
      key: "reset",
      icon: "x",
      label: "Reset changes",
      desc: "Discard all uncommitted changes",
      color: colors.red,
    },
  ] as const;

  return (
    <box flexDirection="column">
      {/* Header */}
      <box
        backgroundColor={colors.purple}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#ffffff">@</text>
        <text fg="#ffffff">
          <b>Git: Uncommitted Changes</b>
        </text>
      </box>

      {/* Content */}
      <box
        backgroundColor={colors.bgDark}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
        gap={0}
      >
        <text fg={colors.textSecondary}>
          You have uncommitted changes. What would you like to do?
        </text>
        <text fg={colors.textPrimary}> </text>

        {optionData.map((opt) => (
          <box
            key={opt.key}
            backgroundColor={selected === opt.key ? colors.bgHover : undefined}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={0}
            paddingBottom={0}
            flexDirection="row"
            gap={2}
          >
            <text fg={opt.color}>{opt.icon}</text>
            <box flexDirection="column">
              <text fg={colors.textPrimary}>{opt.label}</text>
              <text fg={colors.textMuted}>{opt.desc}</text>
            </box>
          </box>
        ))}
      </box>

      {/* Actions */}
      <box
        backgroundColor={colors.bgPanel}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="row"
        gap={2}
        justifyContent="space-between"
      >
        <text fg={colors.textMuted}>Use arrow keys to navigate</text>
        <box flexDirection="row" gap={2}>
          <text
            bg={selected === "cancel" ? colors.bgHover : undefined}
            fg={colors.textSecondary}
          >
            {"  Cancel  "}
          </text>
          <text bg={colors.bgAccent} fg="#ffffff">
            {" Select "}
          </text>
        </box>
      </box>
    </box>
  );
}

// =============================================================================
// Status Bar
// =============================================================================

function StatusBar() {
  const isOpen = useDialogState((s) => s.isOpen);
  const count = useDialogState((s) => s.count);

  return (
    <box
      backgroundColor={colors.bgPanel}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={0}
      paddingBottom={0}
      flexDirection="row"
      justifyContent="space-between"
    >
      <text fg={colors.textMuted}>
        {isOpen ? `Dialog open (${count})` : "Ready"}
      </text>
      <text fg={colors.textMuted}>Press Q to quit</text>
    </box>
  );
}

// =============================================================================
// Activity Log
// =============================================================================

function ActivityLog({ logs }: { logs: string[] }) {
  return (
    <box
      backgroundColor={colors.bgPanel}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      flexDirection="column"
      height={6}
    >
      {logs.length === 0 ? (
        <text fg={colors.textMuted}>No activity yet...</text>
      ) : (
        logs.slice(-4).map((log, idx) => (
          <text key={`log-${idx}`} fg={colors.textSecondary}>
            {log}
          </text>
        ))
      )}
    </box>
  );
}

// =============================================================================
// Main App
// =============================================================================

function App() {
  const renderer = useRenderer();
  const dialog = useDialog();
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, `[${time}] ${message}`].slice(-4));
  };

  useKeyboard(async (key) => {
    switch (key.name) {
      // =========== CONFIRM ===========
      case "1": {
        log("Opening delete confirmation...");
        // console.log("Dialog count (nested):", dialogCount);
        const confirmed = await dialog.confirm({
          content: (ctx) => (
            <DeleteConfirmDialog
              {...ctx}
              filename="src/components/Button.tsx"
            />
          ),
          unstyled: true,
          closeOnClickOutside: true,
        });
        if (confirmed) {
          log("File deleted successfully");
          await dialog.alert({
            content: (ctx) => (
              <SuccessAlertDialog
                {...ctx}
                message="File has been permanently deleted."
              />
            ),
            unstyled: true,
          });
        } else {
          log("Delete cancelled");
        }
        break;
      }

      // =========== ALERT ===========
      case "2": {
        log("Showing success alert...");
        await dialog.alert({
          content: (ctx) => (
            <SuccessAlertDialog
              {...ctx}
              message="Your changes have been saved successfully!"
            />
          ),
          unstyled: true,
        });
        log("Alert dismissed");
        break;
      }

      case "3": {
        log("Showing error alert...");
        await dialog.alert({
          content: (ctx) => (
            <ErrorAlertDialog
              {...ctx}
              title="Connection Failed"
              message="Unable to connect to the server. Please check your internet connection and try again."
            />
          ),
          unstyled: true,
        });
        log("Error dismissed");
        break;
      }

      // =========== CHOICE ===========
      case "4": {
        log("Opening unsaved changes dialog...");
        const action = await dialog.choice<"save" | "discard">({
          content: (ctx) => (
            <UnsavedChangesDialog {...ctx} filename="README.md" />
          ),
          unstyled: true,
          closeOnClickOutside: true,
        });
        if (action === "save") {
          log("Changes saved");
        } else if (action === "discard") {
          log("Changes discarded");
        } else {
          log("Action cancelled");
        }
        break;
      }

      case "5": {
        log("Opening git commit options...");
        const action = await dialog.choice<"commit" | "stash" | "reset">({
          content: (ctx) => <GitCommitDialog {...ctx} />,
          unstyled: true,
          closeOnClickOutside: true,
        });
        if (action) {
          log(`Git action: ${action}`);
        } else {
          log("Git action cancelled");
        }
        break;
      }

      // =========== PROMPT ===========
      case "6": {
        log("Opening rename dialog...");
        const newName = await dialog.prompt<string>({
          content: (ctx) => (
            <RenamePromptDialog {...ctx} currentName="index.ts" />
          ),
          unstyled: true,
        });
        if (newName && newName !== "index.ts") {
          log(`Renamed to: ${newName}`);
        } else {
          log("Rename cancelled");
        }
        break;
      }

      case "q":
        renderer.destroy();
        break;
    }
  });

  return (
    <box flexDirection="column" height="100%" justifyContent="space-between">
      {/* Main Content */}
      <box
        flexDirection="column"
        padding={2}
        paddingTop={1}
        paddingBottom={1}
        justifyContent="space-between"
        height="100%"
      >
        <box flexDirection="column" gap={2}>
          {/* Header */}
          <box flexDirection="column" gap={0}>
            <text fg={colors.blue}>
              <b>@tuiparts/dialog</b>
            </text>
          </box>

          {/* Menu */}
          <box flexDirection="column" gap={1}>
            <text fg={colors.textSecondary}>
              <b>Demo Actions</b>
            </text>

            <box flexDirection="column" gap={0} paddingLeft={1}>
              <text fg={colors.textMuted}>confirm()</text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>1</span> Delete file confirmation
              </text>

              <text fg={colors.textPrimary}> </text>
              <text fg={colors.textMuted}>alert()</text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>2</span> Success notification
              </text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>3</span> Error notification
              </text>

              <text fg={colors.textPrimary}> </text>
              <text fg={colors.textMuted}>choice()</text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>4</span> Unsaved changes
              </text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>5</span> Git commit options
              </text>

              <text fg={colors.textPrimary}> </text>
              <text fg={colors.textMuted}>prompt()</text>
              <text fg={colors.textPrimary}>
                {"  "}
                <span fg={colors.cyan}>6</span> Rename file
              </text>
            </box>
          </box>
        </box>

        {/* Activity Log */}
        <ActivityLog logs={logs} />
      </box>

      {/* Status Bar */}
      <StatusBar />
    </box>
  );
}
1;

// =============================================================================
// Root
// =============================================================================

function Root() {
  return (
    <DialogProvider size="medium" unstyled backdropOpacity={0.35}>
      <App />
    </DialogProvider>
  );
}

// =============================================================================
// Entry Point
// =============================================================================

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
});

renderer.setBackgroundColor(colors.bgDark);
createRoot(renderer).render(<Root />);
