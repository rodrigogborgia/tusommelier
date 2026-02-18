// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';

const sendAppMessageMock = vi.fn();

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
  useDaily: () => ({ join: vi.fn(), leave: vi.fn() }),
  useActiveSpeakerId: () => null,
  useAudioLevelObserver: () => undefined,
  useAppMessage: () => sendAppMessageMock,
}));

vi.mock('../../hooks/use-cvi-call', () => ({
  useCVICall: () => ({ joinCall: vi.fn(), leaveCall: vi.fn() }),
}));

// render the component under test
import { Conversation } from './index';

describe('Conversation', () => {
  it('sends backendReply as an app message after joined-meeting', async () => {
    render(<Conversation onLeave={() => {}} conversationUrl="https://example.test" backendReply="hello from backend" />);

    await waitFor(() => {
      expect(sendAppMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message_type: 'conversation',
          event_type: 'conversation.echo',
          properties: { text: 'hello from backend' },
        })
      );
    });
  });
});
