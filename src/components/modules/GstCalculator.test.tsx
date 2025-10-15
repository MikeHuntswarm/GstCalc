import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$110.00')).toBeInTheDocument();
  });

  it('calculates GST correctly for inclusive amount', () => {
    render(<GstCalculator />);
    fireEvent.click(screen.getByText('Enter Inc-GST'));
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '110' } });
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$110.00')).toBeInTheDocument();
  });
});
