import React from "react";
import { cn } from "@/lib/utils";

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  withTile?: boolean;
  tileClassName?: string;
}

/**
 * Razor-sharp minimal geometric Brand Icon (< / >)
 * Pure 2D flat geometric design: Electric royal blue chevrons bisected by a stark white slash.
 * Tightly cropped to 220 220 584 584 so the icon marks fill the entire container with maximum visibility.
 */
export function BrandIcon({
  className = "w-5 h-5",
  withTile = false,
  tileClassName,
  ...props
}: BrandIconProps) {
  const icon = (
    <svg
      viewBox="220 220 584 584"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Intervue logo"
      {...props}
    >
      {/* Left Chevron (Electric Royal Blue) */}
      <polygon
        points="239,511.5 509,352 527,362 438,462 355,511.5 421,552 392,602 375,592"
        fill="#007BFA"
      />
      {/* Right Chevron (Electric Royal Blue - 180° Rotational Symmetry) */}
      <polygon
        points="784,511.5 514,671 496,661 585,561 668,511.5 602,471 631,421 648,431"
        fill="#007BFA"
      />
      {/* Center Diagonal Slash (Pure Stark White) */}
      <polygon
        points="609,280 673,280 415,743 350,743"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (withTile) {
    return (
      <div
        className={cn(
          "w-8 h-8 rounded-xl bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/35 flex items-center justify-center shadow-md shadow-[#327CF6]/20 shrink-0",
          tileClassName
        )}
      >
        <span className="w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      </div>
    );
  }

  return icon;
}

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Full Brand Logo with Icon and Intervue Wordmark
 */
export function BrandLogo({
  className,
  iconClassName,
  showText = true,
  subtitle,
  size = "md",
}: BrandLogoProps) {
  const sizeConfig = {
    sm: {
      tile: "w-7 h-7 rounded-lg",
      icon: "w-4.5 h-4.5",
      text: "text-sm",
      sub: "text-[9px]",
    },
    md: {
      tile: "w-8 h-8 rounded-xl",
      icon: "w-5 h-5",
      text: "text-[15px]",
      sub: "text-[10px]",
    },
    lg: {
      tile: "w-10 h-10 rounded-xl",
      icon: "w-6 h-6",
      text: "text-lg",
      sub: "text-xs",
    },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          "bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/35 flex items-center justify-center shadow-md shadow-[#327CF6]/20 shrink-0 group-hover:border-[#327CF6]/60 group-hover:scale-105 transition-all duration-200",
          sizeConfig.tile
        )}
      >
        <BrandIcon className={cn(sizeConfig.icon, iconClassName)} />
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-tight">
            <span
              className={cn(
                "text-white font-bold tracking-tight font-sans truncate group-hover:text-zinc-200 transition-colors",
                sizeConfig.text
              )}
            >
              inter<span className="text-[#327CF6]">V</span>ue
            </span>
          </div>
          {subtitle && (
            <p
              className={cn(
                "text-[#525866] font-mono tracking-wide -mt-0.5 truncate",
                sizeConfig.sub
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
