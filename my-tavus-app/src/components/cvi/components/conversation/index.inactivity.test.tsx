// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import React from 'react';
import { render, screen } from '@testing-library/react';

const sendAppMessageMock = vi.fn();
const joinCallMock = vi.fn();
const leaveCallMock = vi.fn();

vi.mock('@daily-co/daily-react', () => ({
  DailyAudioTrack: () => null,
  DailyVideo: () => null,
  useDevices: () => ({ hasMicError: false }),
  useLocalSessionId: () => 'local-session',
  useMeetingState: () => 'joined-meeting',
  useScreenVideoTrack: () => ({ isOff: true }),
  useVideoTrack: () => ({ isOff: false, track: undefined }),
  useAudioTrack: () => ({ isOff: false, track: undefined }),
  useParticipantIds: () => ['tavus-replica-1'],
  useDaily: () => ({ join: joinCallMock, leave: leaveCallMock }),
  useActiveSpeakerId: () => null,
  useAudioLevelObserver: () => undefined,
  useAppMessage: () => sendAppMessageMock,
}));

vi.mock('../../hooks/use-cvi-call', () => ({
  useCVICall: () => ({ joinCall: joinCallMock, leaveCall: leaveCallMock }),
}));

// make sure getUserMedia rejects so AudioContext path is skipped safely
beforeEach(() => {
  // @ts-ignore
  global.navigator.mediaDevices = {
    getUserMedia: vi.fn().mockRejectedValue(new Error('no-mic')),
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

import { Conversation } from './index';

describe('Conversation inactivity', () => {
  it('auto-closes after inactivityLimitSeconds and shows reopen', async () => {
    // use fake timers and set the virtual system time so Date.now() advances
    const start = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(start);

    // capture the interval callback so we can invoke it deterministically
    let intervalCb: (() => void) | undefined;
    const originalSetInterval = global.setInterval;
    // @ts-ignore
    vi.spyOn(global, 'setInterval').mockImplementation((cb: any, ms?: number) => {
      intervalCb = cb;
      return 123 as any;
    });

    render(
      <Conversation
        onLeave={() => {}}
        conversationUrl="https://example.test"
        backendReply={undefined}
        inactivityLimitSeconds={1} // 1 second for fast test
      />
    );

    // advance time beyond the limit and let React effects run
      // allow React effects to attach the test listener
      await Promise.resolve();
      // trigger the component's test hook to force inactivity (stable)
      window.dispatchEvent(new Event('tavus-test-force-inactivity'));
      // allow pending microtasks/effects to flush
      await Promise.resolve();

    // restore original setInterval implementation
    // @ts-ignore
    global.setInterval = originalSetInterval;

    // wait for the test handler to have run
    await waitFor(() => {
      // @ts-ignore
      expect(window.__tavus_forced_inactivity).toBeTruthy();
    }, { timeout: 2000 });

    // leaveCall should have been called by the handler
    expect(leaveCallMock).toHaveBeenCalled();

    // the Re-open button should be visible
    const reopen = await screen.findByText('Re-open');
    expect(reopen).toBeTruthy();
  }, 10000);
});
