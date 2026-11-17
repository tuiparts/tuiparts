/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "./use-theme";

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

export interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  children: ReactNode;
}

export function HoverCard({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  openDelay = 200,
  closeDelay = 300,
  children,
}: HoverCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, openDelay);
  }, [openDelay, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, closeDelay);
  }, [closeDelay, setOpen]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      handleMouseEnter,
      handleMouseLeave,
    }),
    [open, setOpen, handleMouseEnter, handleMouseLeave],
  );

  return (
    <HoverCardContext.Provider value={contextValue}>
      <box flexDirection="column">{children}</box>
    </HoverCardContext.Provider>
  );
}

export interface HoverCardTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function HoverCardTrigger({ children, ...rest }: HoverCardTriggerProps) {
  const context = useContext(HoverCardContext);

  return (
    <Box
      onMouseOver={() => context?.handleMouseEnter()}
      onMouseOut={() => context?.handleMouseLeave()}
      {...rest}
    >
      {children}
    </Box>
  );
}

export interface HoverCardContentProps extends BoxOptions {
  children: ReactNode;
}

export function HoverCardContent({ children, ...rest }: HoverCardContentProps) {
  const context = useContext(HoverCardContext);
  const tokens = useTheme();

  if (context && !context.open) {
    return null;
  }

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      paddingY={1}
      onMouseOver={() => context?.handleMouseEnter()}
      onMouseOut={() => context?.handleMouseLeave()}
      {...rest}
    >
      {children}
    </Box>
  );
}
