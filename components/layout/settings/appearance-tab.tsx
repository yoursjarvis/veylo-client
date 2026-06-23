"use client";

import { useTheme } from "@/components/theme-provider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun01Icon, Moon01Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", icon: Sun01Icon },
    { id: "dark", label: "Dark", icon: Moon01Icon },
    { id: "system", label: "System", icon: ComputerIcon },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks and feels.
        </p>
      </div>

      <div className="space-y-4">
        <Label>Theme Preference</Label>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as "dark" | "light" | "system")}
          className="grid grid-cols-3 gap-4"
        >
          {themes.map((item) => (
            <div key={item.id}>
              <RadioGroupItem
                value={item.id}
                id={item.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={item.id}
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                  theme === item.id && "border-primary bg-accent"
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={24}
                  className="mb-3"
                  strokeWidth={2}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
