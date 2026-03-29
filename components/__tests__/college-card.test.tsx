import { render, screen } from '@testing-library/react';
import { CollegeCard } from '../college-card';
import * as utils from '@/lib/utils';

// Mock Next.js Link
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Link = ({ children, href }: any) => <a href={href}>{children}</a>;
  Link.displayName = 'Link';
  return Link;
});

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  getUrgencyLevel: jest.fn(),
  getUrgencyMessage: jest.fn(),
  getDaysUntilDeadline: jest.fn(),
  hasCostData: jest.fn(),
  getGroupedCosts: jest.fn(),
}));

// Mock status badge components
jest.mock('../status-badge', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatusBadge = ({ status }: any) => <span data-testid="status-badge">{status}</span>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CategoryBadge = ({ category }: any) => <span data-testid="category-badge">{category}</span>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StrategyBadge = ({ strategy }: any) => <span data-testid="strategy-badge">{strategy}</span>;

  StatusBadge.displayName = 'StatusBadge';
  CategoryBadge.displayName = 'CategoryBadge';
  StrategyBadge.displayName = 'StrategyBadge';

  return { StatusBadge, CategoryBadge, StrategyBadge };
});

const mockCollege = {
  id: '1',
  name: 'MIT',
  category: 'REACH' as const,
  status: 'IN_PROGRESS' as const,
  strategy: 'ED' as const,
  deadlineApp: new Date('2024-11-01'),
  deadlineFinaid: new Date('2024-11-15'),
  location: 'Cambridge, MA',
  major: 'Computer Science',
  portalUrl: 'https://portal.mit.edu',
  portalUser: 'student@mit.edu',
  portalPassword: null,
  notes: null,
  costTuition: 60000,
  costRoomBoard: 15000,
  costFees: 2000,
  isInState: false,
  checklist: {
    lorTeacher: true,
    transcriptSent: false,
    testScoresSent: true,
    essayCount: 3,
    mainEssayComplete: true,
    supplementalEssaysCompleted: 1,
    finaidGreenLight: false,
  },
};

describe('CollegeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getUrgencyLevel as jest.Mock).mockReturnValue('green');
    (utils.getUrgencyMessage as jest.Mock).mockReturnValue(null);
    (utils.getDaysUntilDeadline as jest.Mock).mockReturnValue(30);
    (utils.hasCostData as jest.Mock).mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render college name', () => {
      render(<CollegeCard college={mockCollege} />);
      const names = screen.getAllByText('MIT');
      expect(names.length).toBeGreaterThan(0);
    });

    it('should render status badge', () => {
      render(<CollegeCard college={mockCollege} />);
      const badges = screen.getAllByTestId('status-badge');
      expect(badges[0]).toHaveTextContent('IN_PROGRESS');
    });

    it('should render category badge', () => {
      render(<CollegeCard college={mockCollege} />);
      const badges = screen.getAllByTestId('category-badge');
      expect(badges[0]).toHaveTextContent('REACH');
    });

    it('should render strategy badge', () => {
      render(<CollegeCard college={mockCollege} />);
      const badges = screen.getAllByTestId('strategy-badge');
      expect(badges[0]).toHaveTextContent('ED');
    });

    it('should render link to college detail page', () => {
      render(<CollegeCard college={mockCollege} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/college/1');
    });
  });

  describe('Optional Fields', () => {
    it('should render location when provided', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('Cambridge, MA').length).toBeGreaterThan(0);
    });

    it('should not render location when null', () => {
      const collegeWithoutLocation = { ...mockCollege, location: null };
      render(<CollegeCard college={collegeWithoutLocation} />);
      expect(screen.queryByText('Cambridge, MA')).not.toBeInTheDocument();
    });

    it('should render major when provided', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('Computer Science').length).toBeGreaterThan(0);
    });

    it('should not render major when null', () => {
      const collegeWithoutMajor = { ...mockCollege, major: null };
      render(<CollegeCard college={collegeWithoutMajor} />);
      expect(screen.queryByText('Computer Science')).not.toBeInTheDocument();
    });
  });

  describe('Deadlines', () => {
    it('should render application deadline', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText(/App:/).length).toBeGreaterThan(0);
    });

    it('should render financial aid deadline', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText(/FinAid:/).length).toBeGreaterThan(0);
    });

    it('should render days left for deadline', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('30 days left').length).toBeGreaterThan(0);
    });

    it('should render "Due today!" when deadline is today', () => {
      (utils.getDaysUntilDeadline as jest.Mock).mockReturnValue(0);
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('Due today!').length).toBeGreaterThan(0);
    });

    it('should not render days left when deadline is null', () => {
      const collegeWithoutDeadline = { ...mockCollege, deadlineApp: null };
      render(<CollegeCard college={collegeWithoutDeadline} />);
      expect(screen.queryByText(/days left/)).not.toBeInTheDocument();
    });

    it('should not render finaid deadline when null', () => {
      const collegeWithoutFinaid = { ...mockCollege, deadlineFinaid: null };
      render(<CollegeCard college={collegeWithoutFinaid} />);
      expect(screen.queryByText(/FinAid:/)).not.toBeInTheDocument();
    });
  });

  describe('Urgency Indicators', () => {
    it('should show CRITICAL badge for red urgency', () => {
      (utils.getUrgencyLevel as jest.Mock).mockReturnValue('red');
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('CRITICAL').length).toBeGreaterThan(0);
    });

    it('should show WARNING badge for yellow urgency', () => {
      (utils.getUrgencyLevel as jest.Mock).mockReturnValue('yellow');
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('WARNING').length).toBeGreaterThan(0);
    });

    it('should not show urgency badge for green level', () => {
      (utils.getUrgencyLevel as jest.Mock).mockReturnValue('green');
      render(<CollegeCard college={mockCollege} />);
      expect(screen.queryByText('CRITICAL')).not.toBeInTheDocument();
      expect(screen.queryByText('WARNING')).not.toBeInTheDocument();
    });

    it('should render urgency message when provided', () => {
      (utils.getUrgencyMessage as jest.Mock).mockReturnValue('Deadline approaching!');
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText('Deadline approaching!').length).toBeGreaterThan(0);
    });

    it('should not render urgency message when null', () => {
      (utils.getUrgencyMessage as jest.Mock).mockReturnValue(null);
      render(<CollegeCard college={mockCollege} />);
      expect(screen.queryByText(/Deadline/)).not.toBeInTheDocument();
    });
  });

  describe('Checklist Progress', () => {
    it('should calculate progress correctly with checklist', () => {
      render(<CollegeCard college={mockCollege} />);
      // Base 5 items: lorTeacher(✓), transcript(✗), testScores(✓), mainEssay(✓), finaid(✗) = 3
      // Supplemental: 1/3 complete
      // Total: 4/8
      expect(screen.getAllByText('4/8').length).toBeGreaterThan(0);
    });

    it('should show 0/0 progress when no checklist', () => {
      const collegeWithoutChecklist = { ...mockCollege, checklist: null };
      render(<CollegeCard college={collegeWithoutChecklist} />);
      expect(screen.getAllByText('0/0').length).toBeGreaterThan(0);
    });

    it('should handle checklist with 0 essays', () => {
      const collegeWithNoEssays = {
        ...mockCollege,
        checklist: {
          lorTeacher: true,
          transcriptSent: true,
          testScoresSent: true,
          essayCount: 0,
          mainEssayComplete: true,
          supplementalEssaysCompleted: 0,
          finaidGreenLight: true,
        },
      };
      render(<CollegeCard college={collegeWithNoEssays} />);
      // Base 5 items all complete = 5/5
      expect(screen.getAllByText('5/5').length).toBeGreaterThan(0);
    });
  });

  describe('Portal Credentials', () => {
    it('should show portal indicator when portalUrl exists', () => {
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getAllByText(/Portal/).length).toBeGreaterThan(0);
    });

    it('should show portal indicator when portalUser exists', () => {
      const collegeWithUser = { ...mockCollege, portalUrl: null };
      render(<CollegeCard college={collegeWithUser} />);
      expect(screen.getAllByText(/Portal/).length).toBeGreaterThan(0);
    });

    it('should not show portal indicator when both are null', () => {
      const collegeWithoutPortal = {
        ...mockCollege,
        portalUrl: null,
        portalUser: null,
      };
      render(<CollegeCard college={collegeWithoutPortal} />);
      expect(screen.queryByText(/Portal/)).not.toBeInTheDocument();
    });
  });

  describe('Cost Display', () => {
    it('should render cost data when available', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(true);
      (utils.getGroupedCosts as jest.Mock).mockReturnValue({
        tuitionAndFees: 62000,
        roomAndBoard: 15000,
        other: 1000,
        total: 78000,
      });

      render(<CollegeCard college={mockCollege} />);

      expect(screen.getAllByText(/Tuition \+ Fees:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('$62,000.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Room & Board:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('$15,000.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Other:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('$1,000.00').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$78,000.00').length).toBeGreaterThan(0);
    });

    it('should show "Cost N/A" when no cost data', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(false);
      render(<CollegeCard college={mockCollege} />);
      expect(screen.getByText('Cost N/A')).toBeInTheDocument();
    });

    it('should show "(In-State)" label when isInState is true', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(true);
      (utils.getGroupedCosts as jest.Mock).mockReturnValue({
        tuitionAndFees: null,
        roomAndBoard: null,
        other: null,
        total: 50000,
      });

      const inStateCollege = { ...mockCollege, isInState: true };
      render(<CollegeCard college={inStateCollege} />);

      expect(screen.getAllByText('(In-State)').length).toBeGreaterThan(0);
    });

    it('should not show "(In-State)" label when isInState is false', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(true);
      (utils.getGroupedCosts as jest.Mock).mockReturnValue({
        tuitionAndFees: null,
        roomAndBoard: null,
        other: null,
        total: 50000,
      });

      render(<CollegeCard college={mockCollege} />);
      expect(screen.queryByText('(In-State)')).not.toBeInTheDocument();
    });

    it('should handle partial cost data', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(true);
      (utils.getGroupedCosts as jest.Mock).mockReturnValue({
        tuitionAndFees: 60000,
        roomAndBoard: null,
        other: null,
        total: 60000,
      });

      render(<CollegeCard college={mockCollege} />);

      expect(screen.getAllByText(/Tuition \+ Fees:/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Room & Board:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Other:/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle college with all null optional fields', () => {
      const minimalCollege = {
        id: '2',
        name: 'Simple College',
        category: 'SAFETY' as const,
        status: 'NOT_STARTED' as const,
        strategy: 'RD' as const,
        deadlineApp: null,
        deadlineFinaid: null,
        location: null,
        major: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        notes: null,
        checklist: null,
      };

      render(<CollegeCard college={minimalCollege} />);
      expect(screen.getAllByText('Simple College').length).toBeGreaterThan(0);
      expect(screen.getAllByText('0/0').length).toBeGreaterThan(0);
    });

    it('should handle checklist with undefined optional fields', () => {
      const collegeWithPartialChecklist = {
        ...mockCollege,
        checklist: {
          lorTeacher: false,
          transcriptSent: false,
          testScoresSent: false,
          essayCount: 2,
          finaidGreenLight: false,
          // mainEssayComplete and supplementalEssaysCompleted undefined
        },
      };

      render(<CollegeCard college={collegeWithPartialChecklist} />);
      // Base 5 items all false = 0
      // Supplemental: 0/2
      // Total: 0/7
      expect(screen.getAllByText('0/7').length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Layout Column Widths', () => {
    it('should render desktop layout with flex-1 name column', () => {
      const { container } = render(<CollegeCard college={mockCollege} />);
      // Check that desktop layout exists (hidden md:flex)
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      expect(desktopLayout).toBeInTheDocument();

      // Check that name column uses flex-1
      const nameColumn = desktopLayout?.querySelector('.flex-1.p-6.flex.flex-col');
      expect(nameColumn).toBeInTheDocument();
    });

    it('should apply CSS custom property for name column min-width', () => {
      const { container } = render(<CollegeCard college={mockCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const nameColumn = desktopLayout?.querySelector('.flex-1');
      expect(nameColumn).toHaveStyle({ minWidth: 'var(--college-card-name-min)' });
    });

    it('should apply CSS custom property for details column width', () => {
      const { container } = render(<CollegeCard college={mockCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const detailsColumn = desktopLayout?.querySelector('.space-y-2');
      expect(detailsColumn).toHaveStyle({ width: 'var(--college-card-details)' });
    });

    it('should apply CSS custom property for cost column width', () => {
      (utils.hasCostData as jest.Mock).mockReturnValue(true);
      (utils.getGroupedCosts as jest.Mock).mockReturnValue({
        tuitionAndFees: 62000,
        roomAndBoard: 15000,
        other: null,
        total: 77000,
      });

      const { container } = render(<CollegeCard college={mockCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const costColumn = desktopLayout?.querySelector('.space-y-1\\.5');
      expect(costColumn).toHaveStyle({ width: 'var(--college-card-cost)' });
    });

    it('should apply CSS custom property for checklist column width', () => {
      const { container, getByText } = render(<CollegeCard college={mockCollege} />);
      const checklistLabel = getByText('checklist');
      const checklistColumn = checklistLabel.closest('[style*="--college-card-checklist"]');
      expect(checklistColumn).toHaveStyle({ width: 'var(--college-card-checklist)' });
    });

    it('should show data completeness column when percentage < 100%', () => {
      const incompleteCollege = { ...mockCollege, location: null };
      const { container } = render(<CollegeCard college={incompleteCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const allColumns = desktopLayout?.querySelectorAll('.border-l');
      expect(allColumns).toBeTruthy();
      expect(allColumns!.length).toBeGreaterThan(3);
    });

    it('should apply truncate class and title attribute to college name', () => {
      const longNameCollege = { ...mockCollege, name: 'Very Long University Name That Might Get Truncated' };
      const { container } = render(<CollegeCard college={longNameCollege} />);
      const nameTitle = container.querySelector('.text-lg.flex-1.truncate');
      expect(nameTitle).toBeInTheDocument();
      expect(nameTitle).toHaveAttribute('title', 'Very Long University Name That Might Get Truncated');
    });

    it('should apply truncate class and title attribute to location when provided', () => {
      const { container } = render(<CollegeCard college={mockCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const locationElements = desktopLayout?.querySelectorAll('.truncate');
      const locationSpan = Array.from(locationElements || []).find(el => el.textContent === 'Cambridge, MA');
      expect(locationSpan).toBeInTheDocument();
      expect(locationSpan).toHaveAttribute('title', 'Cambridge, MA');
    });

    it('should apply truncate class and title attribute to major when provided', () => {
      const { container } = render(<CollegeCard college={mockCollege} />);
      const desktopLayout = container.querySelector('.hidden.md\\:flex.items-stretch');
      const truncateElements = desktopLayout?.querySelectorAll('.truncate');
      const majorSpan = Array.from(truncateElements || []).find(el => el.textContent === 'Computer Science');
      expect(majorSpan).toBeInTheDocument();
      expect(majorSpan).toHaveAttribute('title', 'Computer Science');
    });
  });
});
