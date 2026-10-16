import { cn } from "@/lib/utils";

// The PetroEye mark (public/image/logo/petroeyeLogo.png, trimmed to
// public/brand/logo-mark.png) is used as a CSS mask, so it is painted with
// the current text colour and follows light/dark mode automatically.
const MASK = "url(/brand/logo-mark.png)";
const RATIO = 1336 / 1105; // width / height of the trimmed artwork

/** The bare eye-and-drop glyph, painted in `currentColor`. Size it by height. */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="PetroEye"
      className={cn("inline-block h-6 shrink-0 bg-current", className)}
      style={{
        aspectRatio: RATIO,
        WebkitMaskImage: MASK,
        maskImage: MASK,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

/** App-icon style: ink tile with the glyph in paper colour (matches the favicon). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-background", className)}>
      <LogoGlyph className="h-[52%]" />
    </span>
  );
}

export function Logo({ subtitle = "Fleet digital twin" }: { subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold tracking-tight">PetroEye</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
