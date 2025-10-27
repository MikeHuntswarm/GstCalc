import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GstCalculator } from './GstCalculator';
import { useAtoStore } from '@/store/ato';

describe('GstCalculator', () => {
  beforeEach(() => {
    useAtoStore.setState({
      data: {
        gst: {
          standardRate: 0.1,
          notes: 'Test notes',
        },
      },
    } as any);
  });

  it('renders the calculator', () => {
    render(<GstCalculator />);
    expect(screen.getByText('GST Calculator')).toBeInTheDocument();
  });

  it('calculates GST correctly for exclusive amount', () => {
    render(<GstCalculator />);
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    const exclusiveCard = screen.getByText('Ex-GST amount').closest('div');
    const gstCard = screen.getByText('GST component').closest('div');
    const inclusiveCard = screen.getByText('Inc-GST total').closest('div');

    expect(exclusiveCard).not.toBeNull();
    expect(gstCard).not.toBeNull();
    expect(inclusiveCard).not.toBeNull();

    expect(within(exclusiveCard as HTMLElement).getByText('$100.00')).toBeInTheDocument();
    expect(within(gstCard as HTMLElement).getByText('$10.00')).toBeInTheDocument();
    expect(within(inclusiveCard as HTMLElement).getByText('$110.00')).toBeInTheDocument();
  });

  it('calculates GST correctly for inclusive amount', async () => {
    render(<GstCalculator />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Enter Inc-GST' }));
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '110' } });
    const exclusiveCard = screen.getByText('Ex-GST amount').closest('div');
    const gstCard = screen.getByText('GST component').closest('div');
    const inclusiveCard = screen.getByText('Inc-GST total').closest('div');

    expect(exclusiveCard).not.toBeNull();
    expect(gstCard).not.toBeNull();
    expect(inclusiveCard).not.toBeNull();

    await waitFor(() =>
      expect(within(exclusiveCard as HTMLElement).getByText('$100.00')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(within(gstCard as HTMLElement).getByText('$10.00')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(within(inclusiveCard as HTMLElement).getByText('$110.00')).toBeInTheDocument(),
    );
  });
});
