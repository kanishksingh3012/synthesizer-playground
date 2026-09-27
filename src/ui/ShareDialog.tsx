import { useMemo, useRef } from 'react';
import { Button, Input, Label, Modal, toast } from '@heroui/react';
import { useStore } from '../state/store';
import { shareUrl } from '../state/share';

/** Share link for the current beat — everything is in the URL, the receiver just opens it. */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const url = useMemo(() => shareUrl(useStore.getState()), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      input.current?.select(); // clipboard blocked: select it so Ctrl/Cmd+C works
      toast.warning('Press Ctrl/Cmd + C to copy the selected link');
      return;
    }
    toast.success('Link copied — send it to anyone');
    onClose();
  };

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Share your beat</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="field-group">
                <Label htmlFor="share-url">Anyone with this link gets your exact beat — no account needed.</Label>
                <Input id="share-url" ref={input} value={url} readOnly fullWidth onFocus={(e) => e.currentTarget.select()} />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose}>
                Close
              </Button>
              <Button variant="primary" onPress={copy}>
                Copy link
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
