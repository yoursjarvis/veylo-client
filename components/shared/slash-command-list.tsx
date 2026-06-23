import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: unknown, range: unknown) => void;
}

interface SlashCommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-md p-2 text-xs">
        No commands found
      </div>
    );
  }

  return (
    <div className="bg-popover text-popover-foreground border border-border shadow-lg rounded-md overflow-hidden max-h-[300px] overflow-y-auto p-1 min-w-[220px] flex flex-col gap-0.5 z-50">
      {props.items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => selectItem(index)}
            className={`flex items-start gap-2.5 px-2.5 py-1.5 text-left w-full rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
              index === selectedIndex ? "bg-accent text-accent-foreground font-semibold" : ""
            }`}
          >
            <div className="p-1 rounded bg-muted/60 text-muted-foreground flex-shrink-0 mt-0.5">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium block truncate text-foreground">{item.title}</span>
              <span className="text-[10px] text-muted-foreground block truncate">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
