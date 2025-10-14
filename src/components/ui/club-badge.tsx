import * as React from "react";
import { cn } from "@/lib/utils";
import { getTeamLogoUrl } from "@/utils/teamLogos";
interface ClubBadgeProps {
  clubName: string;
  logoUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
const ClubBadge = ({
  clubName,
  logoUrl,
  className,
  size = 'sm'
}: ClubBadgeProps) => {
  // Use provided logoUrl or get from storage
  const teamLogoUrl = logoUrl || getTeamLogoUrl(clubName);
  const sizeClasses = {
    sm: {
      container: "gap-2",
      logo: "h-6 w-6",
      text: "text-sm",
      fallbackText: "text-xs"
    },
    md: {
      container: "gap-2",
      logo: "h-8 w-8",
      text: "text-base",
      fallbackText: "text-sm"
    },
    lg: {
      container: "gap-3",
      logo: "h-16 w-16",
      text: "text-xl",
      fallbackText: "text-lg"
    }
  };
  const currentSize = sizeClasses[size];
  return (
    <div className={cn(
      "relative inline-flex items-center justify-center overflow-visible z-10",
      currentSize.container,
      currentSize.logo,
      className
    )}>
      {teamLogoUrl ? (
        <img
          src={teamLogoUrl}
          alt={`${clubName} logo`}
          className="w-full h-full rounded-full object-cover block"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
          <span className={cn("font-medium text-muted-foreground", currentSize.fallbackText)}>
            {clubName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};
export { ClubBadge };