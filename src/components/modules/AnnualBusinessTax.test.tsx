import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnnualBusinessTax } from './AnnualBusinessTax';

// Mock the ATO store
const mockAtoData = {
  company: {
    baseRateEntity: {
      rate: 0.25,
      criteria: 'Aggregated turnover below $50 million and no more than 80% passive income.',
      baseRateTurnoverCap: 50000000,
      passiveIncomeMaxPercent: 80,
    },
    fullRate: {
      rate: 0.3,
      criteria: 'All other companies.',
    },
  },
};

// Mock Zustand store
vi.mock('@/store/ato', () => ({
  useAtoStore: () => ({
    data: mockAtoData,
  }),
}));

describe('AnnualBusinessTax', () => {
  beforeEach(() => {
    // Reset any mocks or state if needed
  });

  it('renders the component with correct title and description', () => {
    render(<AnnualBusinessTax />);

    expect(screen.getByText('Annual company tax estimator')).toBeInTheDocument();
    expect(screen.getByText('Estimate the income tax payable on your company profits and understand how eligibility for the base rate entity impacts cash flow.')).toBeInTheDocument();
  });

  it('shows warning alert about missing inputs initially', () => {
    render(<AnnualBusinessTax />);

    expect(screen.getByText('Provide aggregated turnover, passive income percentage and taxable income to view complete company tax estimates. Placeholder values are shown until all required inputs are supplied.')).toBeInTheDocument();
  });

  it('calculates base rate tax correctly when eligible', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs for base rate eligibility
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('$100,000.00')).toBeInTheDocument(); // 400000 * 0.25
    });
  });

  it('calculates full rate tax when not eligible due to high turnover', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs exceeding turnover cap
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '60000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('$120,000.00')).toBeInTheDocument(); // 400000 * 0.30
    });
  });

  it('calculates full rate tax when not eligible due to high passive income', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs exceeding passive income limit
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('$120,000.00')).toBeInTheDocument(); // 400000 * 0.30
    });
  });

  it('shows base rate eligibility warning when criteria not met', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs that don't qualify for base rate
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '60000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('Base rate entity criteria not met')).toBeInTheDocument();
    });
  });

  it('displays eligibility checklist with correct statuses', async () => {
    render(<AnnualBusinessTax />);

    // Initially all items should be pending
    expect(screen.getAllByText('Pending')).toHaveLength(3);

    // Fill in some inputs
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });

    await waitFor(() => {
      expect(screen.getByText('Aggregated turnover remains within the $50,000,000.00 base rate threshold.')).toBeInTheDocument();
      expect(screen.getByText('Passive income is within the 80% allowance.')).toBeInTheDocument();
    });

    // Fill taxable income
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('Taxable income captured — estimates are up to date.')).toBeInTheDocument();
    });
  });

  it('shows savings information when eligible for base rate', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('Estimated savings vs full rate: $20,000.00')).toBeInTheDocument();
    });
  });

  it('displays after-tax profit estimate', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '400000' } });

    await waitFor(() => {
      expect(screen.getByText('After-tax profit estimate: $300,000.00')).toBeInTheDocument(); // 400000 - 100000
    });
  });

  it('handles zero taxable income correctly', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), { target: { value: '40000000' } });
    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '0' } });

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  it('constrains passive income percentage to 0-100 range', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '150' } });

    // Should be constrained to 100%
    await waitFor(() => {
      expect(screen.getByLabelText('Passive income %')).toHaveValue('100');
    });

    fireEvent.change(screen.getByLabelText('Passive income %'), { target: { value: '-10' } });

    // Should be constrained to 0%
    await waitFor(() => {
      expect(screen.getByLabelText('Passive income %')).toHaveValue('0');
    });
  });
});