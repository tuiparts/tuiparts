/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTheme } from "./use-theme";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const TooltipContext = createContext<TooltipContextValue | null>(null);

export interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <TooltipContext.Provider value={contextValue}>
      <box flexDirection="column">{children}</box>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function TooltipTrigger({ children, ...rest }: TooltipTriggerProps) {
  const context = useContext(TooltipContext);

  return (
    <Box
      onMouseOver={() => context?.setOpen(true)}
      onMouseOut={() => context?.setOpen(false)}
      {...rest}
    >
      {children}
    </Box>
  );
}

export interface TooltipContentProps extends BoxOptions {
  children?: ReactNode;
  content?: string;
  textOptions?: TextOptions;
}

export function TooltipContent({
  children,
  content,
  textOptions,
  ...rest
}: TooltipContentProps) {
  const context = useContext(TooltipContext);
  const tokens = useTheme();

  if (context && !context.open) {
    return null;
  }

  return (
    <box
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      height={3}
      {...rest}
    >
      {content ? (
        <text
          content={content}
          fg={tokens.colors.foreground}
          {...textOptions}
        />
      ) : (
        children
      )}
    </box>
  );
}
