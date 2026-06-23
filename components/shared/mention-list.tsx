import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionItem {
  user: {
    id: string;
    name?: string;
    image?: string;
  };
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label?: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.user.id, label: item.user.name });
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
        No members found
      </div>
    );
  }

  return (
    <div className="bg-popover text-popover-foreground border border-border shadow-lg rounded-md overflow-hidden max-h-[250px] overflow-y-auto p-1 min-w-[200px] flex flex-col gap-0.5 z-50">
      {props.items.map((item, index) => (
        <button
          key={item.user.id}
          type="button"
          onClick={() => selectItem(index)}
          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs text-left w-full rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
            index === selectedIndex ? "bg-accent text-accent-foreground font-semibold" : ""
          }`}
        >
          <Avatar className="h-5 w-5 border border-border flex-shrink-0">
            <AvatarImage src={item.user.image || ""} />
            <AvatarFallback className="bg-muted text-foreground text-[10px]">
              {item.user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{item.user.name}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";
