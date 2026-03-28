import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollegeEditButton } from '../college-edit-button';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock CollegeFormNew
jest.mock('../college-form-new', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CollegeFormNew: ({ college, onSuccess, className, size }: any) => (
    <button
      data-testid="college-form"
      data-college-id={college.id}
      data-class={className}
      data-size={size}
      onClick={() => onSuccess && onSuccess()}
    >
      Edit College
    </button>
  ),
}));

const mockCollege = {
  id: '1',
  name: 'MIT',
  category: 'REACH' as const,
  status: 'IN_PROGRESS' as const,
  strategy: 'ED' as const,
  deadlineApp: new Date('2024-11-01'),
  deadlineFinaid: null,
  location: 'Cambridge, MA',
  major: 'Computer Science',
  portalUrl: 'https://portal.mit.edu',
  portalUser: 'student@mit.edu',
  portalPassword: 'secret',
  notes: 'Test notes',
};

describe('CollegeEditButton', () => {
  const mockRefresh = jest.fn();
  const mockRouter = {
    refresh: mockRefresh,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render CollegeFormNew with college prop', () => {
    render(<CollegeEditButton college={mockCollege} />);

    const form = screen.getByTestId('college-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('data-college-id', '1');
  });

  it('should pass className prop to CollegeFormNew', () => {
    render(<CollegeEditButton college={mockCollege} className="custom-class" />);

    const form = screen.getByTestId('college-form');
    expect(form).toHaveAttribute('data-class', 'custom-class');
  });

  it('should pass size prop to CollegeFormNew', () => {
    render(<CollegeEditButton college={mockCollege} size="sm" />);

    const form = screen.getByTestId('college-form');
    expect(form).toHaveAttribute('data-size', 'sm');
  });

  it('should default size to "default" when not provided', () => {
    render(<CollegeEditButton college={mockCollege} />);

    const form = screen.getByTestId('college-form');
    expect(form).toHaveAttribute('data-size', 'default');
  });

  it('should call router.refresh on success', async () => {
    render(<CollegeEditButton college={mockCollege} />);

    const form = screen.getByTestId('college-form');
    fireEvent.click(form);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
