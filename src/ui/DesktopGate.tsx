import { Button, toast } from '@heroui/react';

/** Phones get this instead of the 3D synth (too small to play, heavy to render). "Try anyway" loads it regardless. */
export function DesktopGate({ onTryAnyway }: { onTryAnyway: () => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast.success('Link copied — open it on your computer');
    } catch {
      toast.warning(`Open ${location.host} on your computer`);
    }
  };
  return (
    <main className="gate">
      <img src="/gate.jpg" alt="The PULSE-16 synthesizer" width={720} height={450} />
      <h1>
        PULSE-16 <b>BASIC</b>
      </h1>
      <p>Made for desktop — play it with your keyboard and mouse on a bigger screen.</p>
      <div className="gate-actions">
        <Button variant="primary" fullWidth onPress={copy}>
          Copy link for my computer
        </Button>
        <Button variant="tertiary" fullWidth onPress={onTryAnyway}>
          Try anyway
        </Button>
      </div>
    </main>
  );
}
