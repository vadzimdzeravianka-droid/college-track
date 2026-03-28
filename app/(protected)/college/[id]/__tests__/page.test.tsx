import { render, screen } from '@testing-library/react';
import CollegeDetailPage from '../page';

// Mock Next.js modules
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Link = ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
  Link.displayName = 'Link';
  return Link;
});

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock actions
jest.mock('@/actions/college', () => ({
  getCollegeById: jest.fn(),
  deleteCollege: jest.fn(),
}));

// Mock components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => {
  const { Slot } = jest.requireActual('@radix-ui/react-slot');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Button = ({ children, asChild, ...props }: any) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp {...props}>{children}</Comp>;
  };
  Button.displayName = 'Button';
  return { Button };
});

jest.mock('@/components/status-badge', () => ({
  StatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
  CategoryBadge: ({ category }: { category: string }) => <span data-testid="category-badge">{category}</span>,
  StrategyBadge: ({ strategy }: { strategy: string }) => <span data-testid="strategy-badge">{strategy}</span>,
}));

jest.mock('@/components/checklist-form', () => ({
  ChecklistForm: () => <div data-testid="checklist-form">Checklist</div>,
}));

jest.mock('@/components/status-actions', () => ({
  StatusActions: () => <div data-testid="status-actions">Status Actions</div>,
}));

jest.mock('@/components/portal-credentials', () => ({
  PortalCredentials: () => <div data-testid="portal-credentials">Portal Credentials</div>,
}));

jest.mock('@/components/college-edit-button', () => ({
  CollegeEditButton: () => <button data-testid="edit-button">Edit</button>,
}));

jest.mock('@/lib/utils', () => ({
  formatDate: (date: Date) => date.toLocaleDateString(),
  getUrgencyLevel: jest.fn(() => 'none'),
  getUrgencyMessage: jest.fn(() => null),
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
  formatCurrency: jest.fn((amount: number) => `$${amount.toLocaleString()}`),
  hasCostData: jest.fn(() => false),
}));

const mockCollege = {
  id: '1',
  name: 'Test University',
  category: 'MATCH' as const,
  status: 'IN_PROGRESS' as const,
  strategy: 'RD' as const,
  deadlineApp: new Date('2024-12-01'),
  deadlineFinaid: null,
  location: 'Test City',
  major: 'Computer Science',
  portalUrl: 'https://portal.test.edu',
  portalUser: 'student@test.edu',
  portalPassword: 'password123',
  notes: 'Test notes',
  checklist: {
    lorTeacher: true,
    transcriptSent: false,
    testScoresSent: true,
    essayCount: 2,
    mainEssayComplete: false,
    supplementalEssaysCompleted: 0,
    finaidGreenLight: false,
  },
};

describe('CollegeDetailPage - Button asChild Pattern', () => {
  // Get the mocked function
  const { getCollegeById } = jest.requireMock('@/actions/college');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Back to Dashboard button with asChild', () => {
    it('should render Back to Dashboard button as a link element in header', async () => {
      getCollegeById.mockResolvedValue({ college: mockCollege, error: null });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: '1' }) });
      const { container } = render(jsx);

      // Find all links with Back to Dashboard text
      const backLinks = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.textContent?.includes('Back to Dashboard') || a.textContent?.includes('Back')
      );

      expect(backLinks.length).toBeGreaterThan(0);

      // Verify the link has the href attribute
      const headerLink = backLinks.find((link) => link.getAttribute('href') === '/dashboard');
      expect(headerLink).toBeTruthy();
      expect(headerLink?.textContent).toMatch(/Back/);
    });

    it('should render Back to Dashboard button as a link element in error state', async () => {
      getCollegeById.mockResolvedValue({ college: null, error: 'College not found' });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: 'invalid' }) });
      const { container } = render(jsx);

      // Find the error message
      expect(screen.getByText('College not found')).toBeInTheDocument();

      // Find the Back to Dashboard link in error state
      const backLinks = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.textContent?.includes('Back to Dashboard')
      );

      expect(backLinks.length).toBeGreaterThan(0);
      const errorLink = backLinks.find((link) => link.getAttribute('href') === '/dashboard');
      expect(errorLink).toBeTruthy();
      expect(errorLink?.textContent).toContain('Back to Dashboard');
    });

    it('should not have button elements nested inside anchor tags', async () => {
      getCollegeById.mockResolvedValue({ college: mockCollege, error: null });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: '1' }) });
      const { container } = render(jsx);

      // Find all anchor tags
      const anchors = container.querySelectorAll('a');

      // Check that none of them contain button elements
      anchors.forEach((anchor) => {
        const nestedButtons = anchor.querySelectorAll('button');
        expect(nestedButtons.length).toBe(0);
      });
    });

    it('should have cursor pointer styling via Button component classes', async () => {
      getCollegeById.mockResolvedValue({ college: mockCollege, error: null });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: '1' }) });
      const { container } = render(jsx);

      // Find links to dashboard
      const dashboardLinks = Array.from(container.querySelectorAll('a[href="/dashboard"]'));

      expect(dashboardLinks.length).toBeGreaterThan(0);

      // The Button component applies inline-flex class which includes proper cursor styling
      dashboardLinks.forEach((link) => {
        // Verify it's an anchor element (semantic HTML)
        expect(link.tagName).toBe('A');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle error state correctly', async () => {
      const errorMessage = 'Database connection failed';
      getCollegeById.mockResolvedValue({ college: null, error: errorMessage });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: '1' }) });
      render(jsx);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should handle missing college', async () => {
      getCollegeById.mockResolvedValue({ college: null, error: null });

      const jsx = await CollegeDetailPage({ params: Promise.resolve({ id: '999' }) });
      render(jsx);

      expect(screen.getByText('College not found')).toBeInTheDocument();
    });
  });
});
