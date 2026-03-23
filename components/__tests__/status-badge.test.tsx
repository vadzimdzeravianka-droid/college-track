import { render, screen } from '@testing-library/react';
import { StatusBadge, CategoryBadge, StrategyBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('should render NOT_STARTED status', () => {
    render(<StatusBadge status="NOT_STARTED" />);
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  it('should render IN_PROGRESS status', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should render SUBMITTED status', () => {
    render(<StatusBadge status="SUBMITTED" />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('should render ACCEPTED status', () => {
    render(<StatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('should apply correct color classes for NOT_STARTED', () => {
    const { container } = render(<StatusBadge status="NOT_STARTED" />);
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should apply correct color classes for ACCEPTED', () => {
    const { container } = render(<StatusBadge status="ACCEPTED" />);
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800');
  });
});

describe('CategoryBadge', () => {
  it('should render REACH category', () => {
    render(<CategoryBadge category="REACH" />);
    expect(screen.getByText('REACH')).toBeInTheDocument();
  });

  it('should render MATCH category', () => {
    render(<CategoryBadge category="MATCH" />);
    expect(screen.getByText('MATCH')).toBeInTheDocument();
  });

  it('should render SAFETY category', () => {
    render(<CategoryBadge category="SAFETY" />);
    expect(screen.getByText('SAFETY')).toBeInTheDocument();
  });

  it('should apply purple color for REACH', () => {
    const { container } = render(<CategoryBadge category="REACH" />);
    expect(container.firstChild).toHaveClass('bg-purple-100', 'text-purple-800');
  });
});

describe('StrategyBadge', () => {
  it('should render ED strategy with full label', () => {
    render(<StrategyBadge strategy="ED" />);
    expect(screen.getByText('Early Decision')).toBeInTheDocument();
  });

  it('should render EA strategy with full label', () => {
    render(<StrategyBadge strategy="EA" />);
    expect(screen.getByText('Early Action')).toBeInTheDocument();
  });

  it('should render RD strategy with full label', () => {
    render(<StrategyBadge strategy="RD" />);
    expect(screen.getByText('Regular Decision')).toBeInTheDocument();
  });

  it('should apply rose color for ED', () => {
    const { container } = render(<StrategyBadge strategy="ED" />);
    expect(container.firstChild).toHaveClass('bg-rose-100', 'text-rose-800');
  });
});
