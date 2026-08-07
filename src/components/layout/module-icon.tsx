import {
  AudioLinesIcon,
  BookOpenIcon,
  LanguagesIcon,
  MessageSquareQuoteIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  "sound-change": AudioLinesIcon,
  conjugation: BookOpenIcon,
  hanja: LanguagesIcon,
  idioms: MessageSquareQuoteIcon,
} as const;

type ModuleIconProps = {
  name: keyof typeof iconMap;
  className?: string;
};

export function ModuleIcon({ name, className }: ModuleIconProps) {
  const Icon = iconMap[name];

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}
