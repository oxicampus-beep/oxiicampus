import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { WHEEL_SEGMENTS, type SpinResult } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

/** Rotate so segment index lands at the top pointer (12 o'clock). */
export function rotationForSegment(segment: number, extraSpins = 5) {
  const offset = 360 - segment * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
  return extraSpins * 360 + offset;
}

type Props = {
  canSpin: boolean;
  nextSpinAt: string | null;
  onSpin: () => Promise<SpinResult>;
  onSpinComplete: (result: SpinResult) => void;
  disabled?: boolean;
};

export default function SpinWheel({ canSpin, nextSpinAt, onSpin, onSpinComplete, disabled }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = useCallback(async () => {
    if (!canSpin || spinning || disabled) return;
    setSpinning(true);
    try {
      const result = await onSpin();
      const target = rotationForSegment(result.segment);
      const base = rotation % 360;
      const delta = target - base + (target <= base ? 360 : 0);
      setRotation(r => r + delta + 5 * 360);

      window.setTimeout(() => {
        setSpinning(false);
        onSpinComplete(result);
      }, 4200);
    } catch {
      setSpinning(false);
    }
  }, [canSpin, spinning, disabled, onSpin, onSpinComplete, rotation]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    el.style.transform = `rotate(${rotation}deg)`;
  }, [rotation]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        <div className="rounded-full p-2 bg-gradient-to-br from-primary/30 to-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
          <div
            ref={wheelRef}
            className={cn(
              "relative h-64 w-64 sm:h-72 sm:w-72 rounded-full border-4 border-primary/40 overflow-hidden"
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4000ms cubic-bezier(0.2, 0.8, 0.2, 1)" : undefined,
            }}
          >
            {WHEEL_SEGMENTS.map((seg, i) => {
              const rotate = i * SEGMENT_ANGLE;
              return (
                <div
                  key={seg.label}
                  className="absolute inset-0 origin-center"
                  style={{ transform: `rotate(${rotate}deg)` }}
                >
                  <div
                    className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 origin-bottom"
                    style={{
                      borderLeft: "72px solid transparent",
                      borderRight: "72px solid transparent",
                      borderBottom: `126px solid ${seg.color}`,
                    }}
                  />
                  <span
                    className="absolute left-1/2 top-[38%] -translate-x-1/2 text-[11px] sm:text-xs font-bold text-black/80 whitespace-nowrap"
                    style={{ transform: `rotate(${SEGMENT_ANGLE / 2}deg)` }}
                  >
                    {seg.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="h-14 w-14 rounded-full bg-background border-2 border-primary/50 shadow-inner grid place-items-center font-display font-bold text-primary text-sm">
                SPIN
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        {!canSpin && nextSpinAt && (
          <p className="text-sm text-muted-foreground">
            Next spin available {new Date(nextSpinAt).toLocaleDateString()}
          </p>
        )}
        <Button
          size="lg"
          className="font-semibold min-w-[160px] gap-2"
          disabled={!canSpin || spinning || disabled}
          onClick={handleSpin}
        >
          {spinning && <Loader2 className="h-4 w-4 animate-spin" />}
          {spinning ? "Spinning…" : canSpin ? "Spin the Wheel" : "On Cooldown"}
        </Button>
        <p className="text-xs text-muted-foreground max-w-xs">
          One spin every 25 days. Data prizes are rare — good luck!
        </p>
      </div>
    </div>
  );
}
