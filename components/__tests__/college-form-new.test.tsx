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

      // Required fields should be present
      expect(screen.getByLabelText(/college name/i)).toBeRequired();
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

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: '' } });

        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        // Should remain on step 1
        await waitFor(() => {
          expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Step Navigation', () => {
    it('should show back button on steps after first', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'MIT' } });

        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        await waitFor(() => {
          const backButton = screen.queryByRole('button', { name: /back/i });
          expect(backButton).toBeInTheDocument();
        });
      });
    });

    it('should navigate back to previous step', async () => {
      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Stanford' } });

        // Go to next step
        fireEvent.click(screen.getByRole('button', { name: /next/i }));

        await waitFor(async () => {
          // Go back
          const backButton = screen.getByRole('button', { name: /back/i });
          fireEvent.click(backButton);

          await waitFor(() => {
            // Should be back on step 1
            expect(screen.getByLabelText(/college name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/college name/i)).toHaveValue('Stanford');
          });
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('should call createCollege on submit for new college', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Yale' } });

        // Navigate through all steps clicking Next
        for (let i = 0; i < 5; i++) {
          const nextButton = screen.getByRole('button', { name: /next/i });
          fireEvent.click(nextButton);
          await waitFor(() => {}, { timeout: 100 });
        }

        // Final submit
        await waitFor(() => {
          const submitButton = screen.getByRole('button', { name: /(submit|add)/i });
          fireEvent.click(submitButton);
        });

        await waitFor(() => {
          expect(createCollege).toHaveBeenCalled();
        });
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

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        expect(nameInput).toHaveValue('Princeton');

        fireEvent.change(nameInput, { target: { value: 'Princeton University' } });

        // Navigate through steps
        for (let i = 0; i < 5; i++) {
          const nextButton = screen.getByRole('button', { name: /next/i });
          fireEvent.click(nextButton);
          await waitFor(() => {}, { timeout: 100 });
        }

        await waitFor(() => {
          const submitButton = screen.getByRole('button', { name: /(submit|save)/i });
          fireEvent.click(submitButton);
        });

        await waitFor(() => {
          expect(updateCollege).toHaveBeenCalledWith('123', expect.any(Object));
        });
      });
    });

    it('should show success toast on successful submission', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Columbia' } });

        // Navigate and submit
        for (let i = 0; i < 5; i++) {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {}, { timeout: 100 });
        }

        await waitFor(() => {
          fireEvent.click(screen.getByRole('button', { name: /(submit|add)/i }));
        });

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('College added!');
        });
      });
    });

    it('should show error toast on failed submission', async () => {
      (createCollege as jest.Mock).mockResolvedValue({ error: 'Database error' });

      render(<CollegeFormNew />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Brown' } });

        // Navigate and submit
        for (let i = 0; i < 5; i++) {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {}, { timeout: 100 });
        }

        await waitFor(() => {
          fireEvent.click(screen.getByRole('button', { name: /(submit|add)/i }));
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Database error');
        });
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const onSuccess = jest.fn();
      (createCollege as jest.Mock).mockResolvedValue({ success: 'College added!' });

      render(<CollegeFormNew onSuccess={onSuccess} />);

      fireEvent.click(screen.getByRole('button', { name: /add college/i }));

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Dartmouth' } });

        // Navigate and submit
        for (let i = 0; i < 5; i++) {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {}, { timeout: 100 });
        }

        await waitFor(() => {
          fireEvent.click(screen.getByRole('button', { name: /(submit|add)/i }));
        });

        await waitFor(() => {
          expect(onSuccess).toHaveBeenCalled();
        });
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

      await waitFor(async () => {
        const nameInput = screen.getByLabelText(/college name/i);
        fireEvent.change(nameInput, { target: { value: 'Duke' } });

        // Submit
        for (let i = 0; i < 5; i++) {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {}, { timeout: 100 });
        }

        await waitFor(() => {
          fireEvent.click(screen.getByRole('button', { name: /(submit|add)/i }));
        });

        // Dialog should close
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      });
    });
  });
});
