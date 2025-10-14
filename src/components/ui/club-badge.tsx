import * as React from "react";
import { cn } from "@/lib/utils";
import { getTeamLogoUrl } from "@/utils/teamLogos";

interface ClubBadgeProps {
  clubName: string;
  logoUrl?: string;
  className?: string; // container classes (no sizing applied by default)
  size?: 'sm' | 'md' | 'lg'; // optional convenience size applied to IMG
  imgClassName?: string; // preferred: pass explicit img sizing here
}

const ClubBadge = ({
  clubName,
  logoUrl,
  className,
  size,
  imgClassName,
}: ClubBadgeProps) => {
  // Use provided logoUrl or get from storage
  const teamLogoUrl = logoUrl || getTeamLogoUrl(clubName);

  // Map convenience sizes to explicit image dimensions
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-16 w-16",
  } as const;

  const imgSize = imgClassName || (size ? sizeClasses[size] : undefined);

  return (
    <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
      {teamLogoUrl ? (
        <img
          src={teamLogoUrl}
          alt={`${clubName} logo`}
          className={cn("object-contain block", imgSize)}
        />
      ) : (
        <div className={cn("rounded bg-muted flex items-center justify-center", imgSize)}>
          <span className={cn("font-medium text-muted-foreground text-xs")}>{clubName.charAt(0).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};

export { ClubBadge };