import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyTaxReference } from './CompanyTaxReference';

const baseRate = {
  rate: 0.25,
  criteria: 'Aggregated turnover below $50 million and <=80% passive income.',
  baseRateTurnoverCap: 50_000_000,
  passiveIncomeMaxPercent: 80,
};
const fullRate = {
  rate: 0.3,
  criteria: 'All other companies.',
};

describe('CompanyTaxReference', () => {
  it('renders both company tax rates and criteria', () => {
    render(<CompanyTaxReference baseRate={baseRate} fullRate={fullRate} />);
    expect(screen.getByText('Company tax quick reference')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('All other companies.')).toBeInTheDocument();
  });

  it('shows the franking note', () => {
    render(<CompanyTaxReference baseRate={baseRate} fullRate={fullRate} />);
    expect(
      screen.getByText(/Companies that qualify for the base rate entity concessions/),
    ).toBeInTheDocument();
  });
});
