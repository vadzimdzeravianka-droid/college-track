import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardFilters } from '../dashboard-filters';

describe('DashboardFilters', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter options', () => {
    render(<DashboardFilters activeFilter="all" onFilterChange={mockOnFilterChange} />);

    expect(screen.getAllByText('All Applications').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not Started').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
  });

  it('should call onFilterChange when button clicked', () => {
    render(<DashboardFilters activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const inProgressButton = screen.getByRole('button', { name: 'In Progress' });
    fireEvent.click(inProgressButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('should highlight active filter', () => {
    render(<DashboardFilters activeFilter="SUBMITTED" onFilterChange={mockOnFilterChange} />);

    const submittedButton = screen.getByRole('button', { name: 'Submitted' });
    expect(submittedButton).not.toHaveClass('outline');
  });

  it('should render mobile filter label', () => {
    render(<DashboardFilters activeFilter="all" onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('should call onFilterChange for each filter', () => {
    render(<DashboardFilters activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const filters = ['All Applications', 'Not Started', 'In Progress', 'Submitted', 'Accepted'];

    filters.forEach((filterName) => {
      const button = screen.getByRole('button', { name: filterName });
      fireEvent.click(button);
    });

    expect(mockOnFilterChange).toHaveBeenCalledTimes(5);
  });
});
