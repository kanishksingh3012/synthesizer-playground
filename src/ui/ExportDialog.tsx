import { useState } from 'react';
import { Button, Checkbox, Label, Modal, ProgressBar, Radio, RadioGroup, toast } from '@heroui/react';
import { download, exportFile, exportSeconds, type ExportFormat } from '../audio/export';

const LOOPS = [1, 2, 4, 8];

function Choice({ value, children }: { value: string; children: string }) {
  return (
    <Radio value={value}>
      <Radio.Content>
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Label>{children}</Label>
      </Radio.Content>
    </Radio>
  );
}

/** Export the current beat as WAV or MP3 (rendered offline: glitch-free and faster than real time). */
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const [loops, setLoops] = useState('4');
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [tail, setTail] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const busy = progress !== null;

  const run = async () => {
    setProgress(0);
    try {
      const { blob, name } = await exportFile({ loops: Number(loops), tail, format }, setProgress);
      download(blob, name);
      toast.success(`Saved ${name}`);
      onClose();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Export failed');
      setProgress(null);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => !open && !busy && onClose()}>
      <Modal.Backdrop isDismissable={!busy}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Export your beat</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <RadioGroup className="field-group" value={loops} onChange={setLoops} isDisabled={busy}>
                <Label>Length</Label>
                {LOOPS.map((n) => (
                  <Choice key={n} value={String(n)}>{`${n}× loop (${exportSeconds({ loops: n, tail: false }).toFixed(0)}s)`}</Choice>
                ))}
              </RadioGroup>
              <RadioGroup className="field-group" value={format} onChange={(v) => setFormat(v as ExportFormat)} isDisabled={busy}>
                <Label>Format</Label>
                <Choice value="wav">WAV (best quality)</Choice>
                <Choice value="mp3">MP3 (small, easy to share)</Choice>
              </RadioGroup>
              <Checkbox isSelected={tail} onChange={setTail} isDisabled={busy}>
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>Let the echo ring out at the end</Label>
                </Checkbox.Content>
              </Checkbox>
              {busy && (
                <ProgressBar className="mt-4" aria-label="Export progress" value={progress * 100}>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose} isDisabled={busy}>
                Cancel
              </Button>
              <Button variant="primary" onPress={run} isDisabled={busy}>
                {busy ? 'Exporting…' : 'Export'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
