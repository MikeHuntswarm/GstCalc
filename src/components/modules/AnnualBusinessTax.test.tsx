import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { formatCurrency, formatPercent } from '@/lib/utils';
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

const ELIGIBLE_SCENARIO = {
  turnover: '40000000',
  passivePercent: '50',
  taxableIncome: '400000',
};

const HIGH_TURNOVER_VALUE = '60000000';
const HIGH_PASSIVE_PERCENT = '85';

const taxableIncomeValue = Number(ELIGIBLE_SCENARIO.taxableIncome);
const baseRateTaxValue = taxableIncomeValue * mockAtoData.company.baseRateEntity.rate;
const fullRateTaxValue = taxableIncomeValue * mockAtoData.company.fullRate.rate;
const savingsValue = fullRateTaxValue - baseRateTaxValue;
const savingsPercentValue = savingsValue / fullRateTaxValue;
const afterTaxProfitValue = taxableIncomeValue - baseRateTaxValue;
const baseRateTurnoverCapLabel = formatCurrency(
  mockAtoData.company.baseRateEntity.baseRateTurnoverCap,
);
const passiveIncomeAllowanceLabel = `${mockAtoData.company.baseRateEntity.passiveIncomeMaxPercent}%`;

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
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    const baseRateCard = screen.getByTestId('card-base-rate');

    await waitFor(() => {
      expect(
        within(baseRateCard).getByText(formatCurrency(baseRateTaxValue)),
      ).toBeInTheDocument();
    });
  });

  it('calculates full rate tax when not eligible due to high turnover', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs exceeding turnover cap
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: HIGH_TURNOVER_VALUE },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    const fullRateCard = screen.getByTestId('card-full-rate');

    await waitFor(() => {
      expect(
        within(fullRateCard).getByText(formatCurrency(fullRateTaxValue)),
      ).toBeInTheDocument();
    });
  });

  it('calculates full rate tax when not eligible due to high passive income', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs exceeding passive income limit
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: HIGH_PASSIVE_PERCENT },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    const fullRateCard = screen.getByTestId('card-full-rate');

    await waitFor(() => {
      expect(
        within(fullRateCard).getByText(formatCurrency(fullRateTaxValue)),
      ).toBeInTheDocument();
    });
  });

  it('shows base rate eligibility warning when criteria not met', async () => {
    render(<AnnualBusinessTax />);

    // Fill in inputs that don't qualify for base rate
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: HIGH_TURNOVER_VALUE },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: HIGH_PASSIVE_PERCENT },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    await screen.findByText('Base rate entity criteria not met');
  });

  it('displays eligibility checklist with correct statuses', async () => {
    render(<AnnualBusinessTax />);

    // Initially all items should be pending
    expect(screen.getAllByText('Pending')).toHaveLength(3);

    // Fill in some inputs
    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });

    await waitFor(() => {
      expect(screen.getByTestId('checklist-detail-turnover')).toHaveTextContent(
        `Turnover remains within the ${baseRateTurnoverCapLabel} base rate threshold.`,
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('checklist-detail-passive-income')).toHaveTextContent(
        `Passive income is within the ${passiveIncomeAllowanceLabel} allowance.`,
      );
    });

    // Fill taxable income
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    await waitFor(() => {
      expect(screen.getByTestId('checklist-detail-taxable-income')).toHaveTextContent(
        'Taxable income captured — estimates are up to date.',
      );
    });
  });

  it('shows savings information when eligible for base rate', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    const summarySection = screen.getByTestId('tax-summary');

    await waitFor(() => {
      expect(
        within(summarySection).getByText(
          (content) =>
            content.includes('Estimated savings vs full rate') &&
            content.includes(formatCurrency(savingsValue)) &&
            content.includes(formatPercent(savingsPercentValue)),
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays after-tax profit estimate', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), {
      target: { value: ELIGIBLE_SCENARIO.taxableIncome },
    });

    const summarySection = screen.getByTestId('tax-summary');

    await waitFor(() => {
      expect(
        within(summarySection).getByText(
          `After-tax profit estimate: ${formatCurrency(afterTaxProfitValue)}`,
        ),
      ).toBeInTheDocument();
    });
  });

  it('handles zero taxable income correctly', async () => {
    render(<AnnualBusinessTax />);

    fireEvent.change(screen.getByLabelText('Aggregated turnover'), {
      target: { value: ELIGIBLE_SCENARIO.turnover },
    });
    fireEvent.change(screen.getByLabelText('Passive income %'), {
      target: { value: ELIGIBLE_SCENARIO.passivePercent },
    });
    fireEvent.change(screen.getByLabelText('Taxable income for the year'), { target: { value: '0' } });

    const summarySection = screen.getByTestId('tax-summary');

    await waitFor(() => {
      expect(summarySection).toHaveTextContent('Estimated company tax payable');
      expect(summarySection).toHaveTextContent(formatCurrency(0));
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