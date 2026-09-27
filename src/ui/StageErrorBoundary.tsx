import { Component, type ReactNode } from 'react';
import { Button } from '@heroui/react';

/** If the 3D synth can't start (no WebGL: hardware acceleration off, very old GPU, locked-down PC), say so instead of a blank page. */
export class StageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="stage-error" role="alert">
        <h2>Your browser couldn't start 3D graphics</h2>
        <p>HEX-16 needs WebGL to draw the synth. Try one of these:</p>
        <ul>
          <li>Use a recent Chrome, Edge, Firefox or Safari.</li>
          <li>Turn on hardware acceleration in your browser settings (Chrome: Settings → System).</li>
          <li>Close other tabs that use a lot of graphics, then reload.</li>
        </ul>
        <Button variant="primary" onPress={() => location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}
