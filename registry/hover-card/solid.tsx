/** @jsxImportSource @opentui/solid */

import type { BoxOptions } from "@opentui/core";
import {
  type Accessor,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  splitProps,
  useContext,
} from "solid-js";
import { useTheme } from "./use-theme";

interface HoverCardContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const HoverCardContext = createContext<HoverCardContextValue>();

export interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  children?: JSX.Element;
}

export function HoverCard(props: HoverCardProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = () => (props.open !== undefined ? props.open : internalOpen());

  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const openDelay = () => props.openDelay ?? 200;
  const closeDelay = () => props.closeDelay ?? 300;

  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const handleMouseEnter = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    openTimer = setTimeout(() => {
      setOpen(true);
    }, openDelay());
  };

  const handleMouseLeave = () => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    closeTimer = setTimeout(() => {
      setOpen(false);
    }, closeDelay());
  };

  onCleanup(() => {
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
  });

  const contextValue: HoverCardContextValue = {
    open,
    setOpen,
    handleMouseEnter,
    handleMouseLeave,
  };

  return (
    <HoverCardContext.Provider value={contextValue}>
      <box flexDirection="column">{props.children}</box>
    </HoverCardContext.Provider>
  );
}

export interface HoverCardTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function HoverCardTrigger(props: HoverCardTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(HoverCardContext);

  return (
    <Box
      onMouseOver={() => context?.handleMouseEnter()}
      onMouseOut={() => context?.handleMouseLeave()}
      {...rest}
    >
      {local.children}
    </Box>
  );
}

export interface HoverCardContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function HoverCardContent(props: HoverCardContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(HoverCardContext);
  const tokens = useTheme();

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      paddingY={1}
      visible={context?.open() ?? true}
      onMouseOver={() => context?.handleMouseEnter()}
      onMouseOut={() => context?.handleMouseLeave()}
      {...rest}
    >
      {local.children}
    </Box>
  );
}
