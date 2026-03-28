import { render, screen } from '@testing-library/react';
import { StatsOverview } from '../stats-overview';

const mockColleges = [
  { status: 'NOT_STARTED' as const },
  { status: 'NOT_STARTED' as const },
  { status: 'IN_PROGRESS' as const },
  { status: 'IN_PROGRESS' as const },
  { status: 'IN_PROGRESS' as const },
  { status: 'SUBMITTED' as const },
  { status: 'SUBMITTED' as const },
  { status: 'ACCEPTED' as const },
  { status: 'DECLINED' as const },
];

describe('StatsOverview', () => {
  it('should render total count', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  it('should render not started count', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('should render in progress count', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('should render submitted count', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('should render accepted count', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('should calculate "Done" count as submitted + accepted', () => {
    render(<StatsOverview colleges={mockColleges} />);
    // submitted (2) + accepted (1) = 3
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('should render with empty colleges array', () => {
    render(<StatsOverview colleges={[]} />);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('should render mobile stats labels', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should render desktop stats labels', () => {
    render(<StatsOverview colleges={mockColleges} />);
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('should handle all colleges in one status', () => {
    const allInProgress = [
      { status: 'IN_PROGRESS' as const },
      { status: 'IN_PROGRESS' as const },
      { status: 'IN_PROGRESS' as const },
    ];

    render(<StatsOverview colleges={allInProgress} />);

    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
