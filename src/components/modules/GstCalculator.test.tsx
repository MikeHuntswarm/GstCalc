import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { GstCalculator } from './GstCalculator';
import { useAtoStore } from '@/store/ato';
import type { AtoData } from '@/types/ato';

const mockAtoData: AtoData = {
  metadata: {
    source: 'test',
    lastUpdated: new Date().toISOString(),
  },
  gst: {
    standardRate: 0.1,
    notes: 'Test notes',
  },
  individual: {
    financialYears: [],
    medicare: undefined,
    offsets: [],
  },
  company: {
    baseRateEntity: {
      rate: 0.25,
      criteria: 'Base rate entity (test)',
      baseRateTurnoverCap: 50_000_000,
      passiveIncomeMaxPercent: 80,
    },
    fullRate: {
      rate: 0.3,
      criteria: 'Full rate (test)',
    },
  },
  penalties: {
    failureToLodge: {
      unitValue: 364,
      maxUnits: 5,
      frequencyDays: 28,
      description: 'Test failure to lodge schedule',
    },
    generalInterestCharge: {
      description: 'Test general interest charge',
    },
  },
  lodgements: undefined,
  taxPlanning: undefined,
  smallBusiness: undefined,
  interestRates: undefined,
};

describe('GstCalculator', () => {
  beforeEach(() => {
    useAtoStore.setState((state) => ({
      ...state,
      data: mockAtoData,
      status: 'success',
      error: null,
      stale: false,
    }));
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
