import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GstBasHelper } from './GstBasHelper';

describe('GstBasHelper', () => {
  it('renders the BAS helper with GST rate', () => {
    render(<GstBasHelper gstRate={0.1} />);
    expect(screen.getByText('GST BAS helper')).toBeInTheDocument();
    expect(screen.getByText('Autofill GST on sales (10%)')).toBeInTheDocument();
  });

  it('computes net GST as collected minus credits', () => {
    render(<GstBasHelper gstRate={0.1} />);
    fireEvent.change(screen.getByLabelText('GST collected (1A)'), {
      target: { value: '12500' },
    });
    fireEvent.change(screen.getByLabelText('GST credits (1B)'), {
      target: { value: '8500' },
    });
    expect(screen.getByText('$4,000.00')).toBeInTheDocument();
    expect(screen.getByText('Payable (1A - 1B)')).toBeInTheDocument();
  });

  it('shows refund badge when credits exceed collected', () => {
    render(<GstBasHelper gstRate={0.1} />);
    fireEvent.change(screen.getByLabelText('GST collected (1A)'), {
      target: { value: '3000' },
    });
    fireEvent.change(screen.getByLabelText('GST credits (1B)'), {
      target: { value: '4000' },
    });
    expect(screen.getByText('Refund due')).toBeInTheDocument();
  });

  it('autofills GST on sales using inclusive-extraction math', async () => {
    render(<GstBasHelper gstRate={0.1} />);
    // $11,000 GST-inclusive at 10% → $1,000 GST component
    fireEvent.change(screen.getByLabelText('Total sales (G1)'), {
      target: { value: '11000' },
    });
    fireEvent.change(screen.getByLabelText('GST collected (1A)'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('GST credits (1B)'), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByText('Autofill GST on sales (10%)'));

    // 11000 - 11000/(1.1) = 1000, and net GST = 1000 - 0
    await waitFor(() => {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });
  });

  it('autofill handles non-round amounts via the shared calculator', async () => {
    render(<GstBasHelper gstRate={0.1} />);
    // 100.50 inclusive → gst = 100.50 - 100.50/1.1 = 9.14 (rounded)
    fireEvent.change(screen.getByLabelText('Total sales (G1)'), {
      target: { value: '100.50' },
    });
    fireEvent.change(screen.getByLabelText('GST collected (1A)'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('GST credits (1B)'), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByText('Autofill GST on sales (10%)'));

    await waitFor(() => {
      expect(screen.getByText('$9.14')).toBeInTheDocument();
    });
  });
});
