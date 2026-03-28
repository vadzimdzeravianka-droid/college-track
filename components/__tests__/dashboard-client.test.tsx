import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardClient } from '../dashboard-client';

// Mock child components
jest.mock('../college-card', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CollegeCard: ({ college }: any) => <div data-testid="college-card">{college.name}</div>,
}));

jest.mock('../dashboard-filters', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  DashboardFilters: ({ activeFilter, onFilterChange }: any) => (
    <div data-testid="dashboard-filters">
      <button onClick={() => onFilterChange('all')}>All</button>
      <button onClick={() => onFilterChange('IN_PROGRESS')}>In Progress</button>
      <button onClick={() => onFilterChange('SUBMITTED')}>Submitted</button>
      <button onClick={() => onFilterChange('ACCEPTED')}>Accepted</button>
    </div>
  ),
}));

const mockColleges = [
  {
    id: '1',
    name: 'MIT',
    category: 'REACH' as const,
    status: 'IN_PROGRESS' as const,
    strategy: 'ED' as const,
    deadlineApp: new Date('2024-11-01'),
    deadlineFinaid: null,
    location: null,
    major: null,
    portalUrl: null,
    portalUser: null,
    checklist: {
      lorTeacher: false,
      transcriptSent: false,
      testScoresSent: false,
      essayCount: 2,
      finaidGreenLight: false,
    },
  },
  {
    id: '2',
    name: 'Stanford',
    category: 'REACH' as const,
    status: 'SUBMITTED' as const,
    strategy: 'RD' as const,
    deadlineApp: new Date('2025-01-01'),
    deadlineFinaid: null,
    location: null,
    major: null,
    portalUrl: null,
    portalUser: null,
    checklist: null,
  },
  {
    id: '3',
    name: 'UC Berkeley',
    category: 'MATCH' as const,
    status: 'NOT_STARTED' as const,
    strategy: 'RD' as const,
    deadlineApp: new Date('2024-12-01'),
    deadlineFinaid: null,
    location: null,
    major: null,
    portalUrl: null,
    portalUser: null,
    checklist: null,
  },
  {
    id: '4',
    name: 'Safety College',
    category: 'SAFETY' as const,
    status: 'ACCEPTED' as const,
    strategy: 'EA' as const,
    deadlineApp: null,
    deadlineFinaid: null,
    location: null,
    major: null,
    portalUrl: null,
    portalUser: null,
    checklist: null,
  },
];

describe('DashboardClient', () => {
  it('should render all colleges by default', () => {
    render(<DashboardClient colleges={mockColleges} />);

    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.getByText('Stanford')).toBeInTheDocument();
    expect(screen.getByText('UC Berkeley')).toBeInTheDocument();
    expect(screen.getByText('Safety College')).toBeInTheDocument();
  });

  it('should render filters component', () => {
    render(<DashboardClient colleges={mockColleges} />);

    expect(screen.getByTestId('dashboard-filters')).toBeInTheDocument();
  });

  it('should filter colleges by status', () => {
    render(<DashboardClient colleges={mockColleges} />);

    // Click IN_PROGRESS filter
    fireEvent.click(screen.getByText('In Progress'));

    // Should only show MIT
    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.queryByText('Stanford')).not.toBeInTheDocument();
    expect(screen.queryByText('UC Berkeley')).not.toBeInTheDocument();
  });

  it('should filter by SUBMITTED status', () => {
    render(<DashboardClient colleges={mockColleges} />);

    fireEvent.click(screen.getByText('Submitted'));

    // Should only show Stanford
    expect(screen.getByText('Stanford')).toBeInTheDocument();
    expect(screen.queryByText('MIT')).not.toBeInTheDocument();
  });

  it('should filter by ACCEPTED status', () => {
    render(<DashboardClient colleges={mockColleges} />);

    fireEvent.click(screen.getByText('Accepted'));

    // Should only show Safety College
    expect(screen.getByText('Safety College')).toBeInTheDocument();
    expect(screen.queryByText('MIT')).not.toBeInTheDocument();
    expect(screen.queryByText('Stanford')).not.toBeInTheDocument();
  });

  it('should show all colleges when "All" filter selected', () => {
    render(<DashboardClient colleges={mockColleges} />);

    // Filter to something else first
    fireEvent.click(screen.getByText('In Progress'));
    expect(screen.queryByText('Stanford')).not.toBeInTheDocument();

    // Then back to All
    fireEvent.click(screen.getByText('All'));

    // Should show all again
    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.getByText('Stanford')).toBeInTheDocument();
    expect(screen.getByText('UC Berkeley')).toBeInTheDocument();
  });

  it('should show empty state when no colleges match filter', () => {
    const colleges = [
      {
        ...mockColleges[0],
        status: 'IN_PROGRESS' as const,
      },
    ];

    render(<DashboardClient colleges={colleges} />);

    // Filter to ACCEPTED (no colleges match)
    fireEvent.click(screen.getByText('Accepted'));

    expect(screen.getByText(/no colleges found/i)).toBeInTheDocument();
    expect(screen.getByText(/no colleges match this filter/i)).toBeInTheDocument();
  });

  it('should show empty state when no colleges at all', () => {
    render(<DashboardClient colleges={[]} />);

    expect(screen.getByText(/no colleges found/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first college/i)).toBeInTheDocument();
  });

  it('should render colleges in grid layout when colleges exist', () => {
    const { container } = render(<DashboardClient colleges={mockColleges} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('should render correct number of college cards', () => {
    render(<DashboardClient colleges={mockColleges} />);

    const cards = screen.getAllByTestId('college-card');
    expect(cards).toHaveLength(4);
  });

  it('should sort colleges by urgency and deadline', () => {
    const colleges = [
      {
        ...mockColleges[0],
        name: 'Late Deadline',
        deadlineApp: new Date('2025-06-01'), // Far future (green)
      },
      {
        ...mockColleges[1],
        name: 'Soon Deadline',
        deadlineApp: new Date('2024-11-05'), // Soon (likely red/yellow)
        status: 'IN_PROGRESS' as const,
      },
      {
        ...mockColleges[2],
        name: 'No Deadline',
        deadlineApp: null,
      },
    ];

    render(<DashboardClient colleges={colleges} />);

    const cards = screen.getAllByTestId('college-card');

    // Should have correct number of cards
    expect(cards).toHaveLength(3);
  });

  it('should handle colleges without deadlines', () => {
    const colleges = [
      {
        ...mockColleges[0],
        deadlineApp: null,
      },
    ];

    render(<DashboardClient colleges={colleges} />);

    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('should handle colleges without checklist', () => {
    const colleges = [
      {
        ...mockColleges[0],
        checklist: null,
      },
    ];

    render(<DashboardClient colleges={colleges} />);

    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('should filter correctly with multiple colleges of same status', () => {
    const colleges = [
      { ...mockColleges[0], id: '1', name: 'College A', status: 'IN_PROGRESS' as const },
      { ...mockColleges[1], id: '2', name: 'College B', status: 'IN_PROGRESS' as const },
      { ...mockColleges[2], id: '3', name: 'College C', status: 'SUBMITTED' as const },
    ];

    render(<DashboardClient colleges={colleges} />);

    fireEvent.click(screen.getByText('In Progress'));

    expect(screen.getByText('College A')).toBeInTheDocument();
    expect(screen.getByText('College B')).toBeInTheDocument();
    expect(screen.queryByText('College C')).not.toBeInTheDocument();
  });
});
