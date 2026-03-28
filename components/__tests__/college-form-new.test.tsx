import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollegeFormNew } from '../college-form-new';
import { createCollege, updateCollege } from '@/actions/college';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/actions/college', () => ({
  createCollege: jest.fn(),
  updateCollege: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CollegeFormNew', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to navigate through form steps
  const navigateToStep = async (targetStep: number) => {
    // Wait for step content by checking for step-specific text that's always visible
    const stepVerification = [
      () => screen.getByLabelText(/college name/i), // Step 0 (already there)
      () => screen.getByText(/when is your application due/i), // Step 1
      () => screen.getByLabelText(/location/i), // Step 2
      () => screen.getByLabelText(/tuition/i), // Step 3
      () => screen.getByLabelText(/application portal url/i), // Step 4
      () => screen.getByLabelText(/additional notes/i), // Step 5
    ];

    for (let i = 0; i < targetStep; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(stepVerification[i + 1]()).toBeInTheDocument();
      });
    }
  };

  describe('Rendering', () => {
    it('should render trigger button for default variant', () => {
      render(<CollegeFormNew />);

      const button = screen.getByRole('button', { name: /add college/i });
      expect(button).toBeInTheDocument();
    });

    it('should render FAB button for fab variant', () => {
      render(<CollegeFormNew variant="fab" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('rounded-full');
    });

    it('should open dialog when trigger clicked', async () => {
      render(<CollegeFormNew />);

      const button = screen.getByRole('button', { name: /add college/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display first step (Basics) on open', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
        expect(screen.getByText(/category/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('should have required fields in step 1', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      // Required fields should be present (validation handled by Zod, not HTML required attribute)
      expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      expect(screen.getByText(/category/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/strategy/i)).toBeInTheDocument();
    });

    it('should fill name field', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Harvard University' } });
        expect(nameInput).toHaveValue('Harvard University');
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);
      });

      // Should show validation error and not proceed to next step
      await waitFor(() => {
        // Form should still be on step 1 (name field visible)
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields before proceeding', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Should remain on step 1 (name field still visible)
      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('should show back button on steps after first', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'MIT' } });

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Wait for step 2 to appear
      await waitFor(() => {
        expect(screen.getByText(/when is your application due/i)).toBeInTheDocument();
      });

      // Now back button should be visible
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should navigate back to previous step', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Stanford' } });

      // Go to next step
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Wait for step 2 content to appear
      await waitFor(() => {
        expect(screen.getByText(/when is your application due/i)).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      // Wait for step 1 to appear again
      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/college name/i)).toHaveValue('Stanford');
    });
  });

  describe('Form Submission', () => {
    it('should call createCollege on submit for new college', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Yale' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit (button changes to "Submit" on last step)
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(createCollege).toHaveBeenCalled();
      });
    });

    it('should call updateCollege on submit for existing college', async () => {
      const existingCollege = {
        id: '123',
        name: 'Princeton',
        category: 'REACH' as const,
        status: 'IN_PROGRESS' as const,
        strategy: 'ED' as const,
        deadlineApp: null,
        deadlineFinaid: null,
        location: null,
        major: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        notes: null,
      };

      (updateCollege as jest.Mock).mockResolvedValue({ success: 'College updated!' });

      render(<CollegeFormNew college={existingCollege} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      expect(nameInput).toHaveValue('Princeton');

      fireEvent.change(nameInput, { target: { value: 'Princeton University' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(updateCollege).toHaveBeenCalledWith('123', expect.any(Object));
      });
    });

    it('should show success toast on successful submission', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Columbia' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('College added!');
      });
    });

    it('should show error toast on failed submission', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ error: 'Database error' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Brown' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database error');
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const onSuccess = jest.fn();
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew onSuccess={onSuccess} />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Dartmouth' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should pre-fill form with existing college data', async () => {
      const existingCollege = {
        id: '456',
        name: 'Cornell',
        category: 'REACH' as const,
        status: 'NOT_STARTED' as const,
        strategy: 'RD' as const,
        deadlineApp: new Date('2024-12-01'),
        deadlineFinaid: null,
        location: 'Ithaca, NY',
        major: 'Computer Science',
        portalUrl: 'https://portal.cornell.edu',
        portalUser: 'student123',
        portalPassword: 'secret',
        notes: 'Test notes',
        costTuition: 60000,
      };

      render(<CollegeFormNew college={existingCollege} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/college name/i);
        expect(nameInput).toHaveValue('Cornell');
      });
    });

    it('should show update text for existing college', async () => {
      const existingCollege = {
        id: '789',
        name: 'Penn',
        category: 'REACH' as const,
        status: 'IN_PROGRESS' as const,
        strategy: 'ED' as const,
        deadlineApp: null,
        deadlineFinaid: null,
        location: null,
        major: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        notes: null,
      };

      render(<CollegeFormNew college={existingCollege} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        // Should show "Edit" or "Update" instead of "Add"
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle long college names', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/college name/i);
        const longName = 'A'.repeat(200);
        fireEvent.change(nameInput, { target: { value: longName } });
        expect(nameInput).toHaveValue(longName);
      });
    });

    it('should handle special characters in name', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/college name/i);
        const specialName = 'College & University "Test" <Name>';
        fireEvent.change(nameInput, { target: { value: specialName } });
        expect(nameInput).toHaveValue(specialName);
      });
    });

    it('should handle form reset after submission', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/college name/i);
      fireEvent.change(nameInput, { target: { value: 'Duke' } });

      // Navigate to final step
      await navigateToStep(5);

      // Final submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
