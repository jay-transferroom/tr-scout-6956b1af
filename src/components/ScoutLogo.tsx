import React from "react";
import { cn } from "@/lib/utils";

interface ScoutLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export const ScoutLogo = ({ size = "md", className, showText = true }: ScoutLogoProps) => {
  const badgeSizes = {
    sm: "w-7 h-7 text-xs rounded-md",
    md: "w-9 h-9 text-sm rounded-lg",
    lg: "w-12 h-12 text-base rounded-xl"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div 
        className={cn(
          "bg-[#3A9D5C] text-white font-semibold inline-flex items-center justify-center shrink-0",
          badgeSizes[size]
        )}
      >
        TR
      </div>
      {showText && (
        <span className={cn("font-normal text-foreground whitespace-nowrap", textSizes[size])}>
          TransferRoom <span className="font-semibold">Scout</span>
        </span>
      )}
    </div>
  );
};