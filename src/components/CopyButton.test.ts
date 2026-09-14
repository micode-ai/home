import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CopyButton from './CopyButton.svelte';

const props = {
  value: '5833510147',
  label: 'Copy NIP',
  copiedLabel: 'Copied!',
  failedLabel: 'Copy failed',
};

describe('CopyButton', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('renders an icon button with the given accessible label and no status text yet', () => {
    const { getByLabelText, queryByText } = render(CopyButton, { props });
    expect(getByLabelText('Copy NIP')).toBeTruthy();
    expect(queryByText('Copied!')).toBeNull();
  });

  it('copies the value and shows the copied confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByLabelText, getByText } = render(CopyButton, { props });

    await fireEvent.click(getByLabelText('Copy NIP'));

    expect(writeText).toHaveBeenCalledWith('5833510147');
    expect(getByText('Copied!')).toBeTruthy();
  });

  it('shows the failure message when copying fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);
    const { getByLabelText, getByText } = render(CopyButton, { props });

    await fireEvent.click(getByLabelText('Copy NIP'));

    expect(getByText('Copy failed')).toBeTruthy();
  });
});
