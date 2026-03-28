import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChecklistForm } from '../checklist-form';
import { updateChecklist } from '@/actions/college';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/actions/college', () => ({
  updateChecklist: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockChecklist = {
  id: 'c1',
  collegeId: '1',
  lorTeacher: false,
  transcriptSent: false,
  testScoresSent: false,
  essayCount: 3,
  mainEssayComplete: false,
  supplementalEssaysCompleted: 1,
  finaidGreenLight: false,
};

describe('ChecklistForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all checklist items', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      expect(screen.getByLabelText(/Letter of Recommendation/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Transcript Sent/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Test Scores Sent/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Financial Aid Documents/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Main Essay Complete/)).toBeInTheDocument();
    });

    it('should render essay count input', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const essayCountInput = screen.getByLabelText(/Total Supplemental Essays:/);
      expect(essayCountInput).toBeInTheDocument();
      expect(essayCountInput).toHaveValue(3);
    });

    it('should render supplemental completed input when essay count > 0', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const completedInput = screen.getByLabelText(/Completed:/);
      expect(completedInput).toBeInTheDocument();
      expect(completedInput).toHaveValue(1);
    });

    it('should not render supplemental completed when essay count is 0', () => {
      const checklistWithNoEssays = { ...mockChecklist, essayCount: 0 };
      render(<ChecklistForm checklist={checklistWithNoEssays} collegeId="1" />);

      expect(screen.queryByLabelText(/Completed:/)).not.toBeInTheDocument();
    });

    it('should show locked message when disabled', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" disabled />);

      expect(screen.getByText(/Checklist locked/)).toBeInTheDocument();
      expect(screen.getByText(/Final decision recorded/)).toBeInTheDocument();
    });

    it('should not show locked message when not disabled', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      expect(screen.queryByText(/Checklist locked/)).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    it('should call updateChecklist when lorTeacher is toggled', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Letter of Recommendation/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { lorTeacher: true });
      });
    });

    it('should call updateChecklist when transcriptSent is toggled', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Transcript Sent/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { transcriptSent: true });
      });
    });

    it('should call updateChecklist when testScoresSent is toggled', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Test Scores Sent/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { testScoresSent: true });
      });
    });

    it('should call updateChecklist when finaidGreenLight is toggled', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Financial Aid Documents/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { finaidGreenLight: true });
      });
    });

    it('should call updateChecklist when mainEssayComplete is toggled', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Main Essay Complete/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { mainEssayComplete: true });
      });
    });

    it('should show success toast on successful update', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Checklist updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Letter of Recommendation/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Checklist updated!');
      });
    });

    it('should show error toast on failed update', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ error: 'Update failed' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Letter of Recommendation/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Essay Count Management', () => {
    it('should update essay count when changed', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const input = screen.getByLabelText(/Total Supplemental Essays:/);
      fireEvent.change(input, { target: { value: '5' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { essayCount: 5 });
      });
    });

    it('should clamp supplemental completed when essay count decreases', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      // mockChecklist has essayCount: 3, supplementalCompleted: 1
      // Decrease to 0
      const input = screen.getByLabelText(/Total Supplemental Essays:/);
      fireEvent.change(input, { target: { value: '0' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', {
          essayCount: 0,
          supplementalEssaysCompleted: 0,
        });
      });
    });

    it('should not clamp supplemental completed when essay count increases', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      // mockChecklist has essayCount: 3, supplementalCompleted: 1
      // Increase to 5 (supplementalCompleted stays at 1)
      const input = screen.getByLabelText(/Total Supplemental Essays:/);
      fireEvent.change(input, { target: { value: '5' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { essayCount: 5 });
      });
    });

    it('should hide supplemental completed input when essay count set to 0', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const input = screen.getByLabelText(/Total Supplemental Essays:/);
      fireEvent.change(input, { target: { value: '0' } });

      await waitFor(() => {
        expect(screen.queryByLabelText(/Completed:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Supplemental Essays Completion', () => {
    it('should update supplemental completed when changed', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const input = screen.getByLabelText(/Completed:/);
      fireEvent.change(input, { target: { value: '2' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', {
          supplementalEssaysCompleted: 2,
        });
      });
    });

    it('should clamp supplemental completed to essay count', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      // essayCount is 3, try to set to 5
      const input = screen.getByLabelText(/Completed:/);
      fireEvent.change(input, { target: { value: '5' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', {
          supplementalEssaysCompleted: 3, // clamped to essayCount
        });
      });
    });

    it('should clamp supplemental completed to 0 minimum', async () => {
      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      const input = screen.getByLabelText(/Completed:/);
      fireEvent.change(input, { target: { value: '-1' } });

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', {
          supplementalEssaysCompleted: 0, // clamped to 0
        });
      });
    });

    it('should show remaining days calculation', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" />);

      // essayCount: 3, supplementalCompleted: 1
      // Remaining: 2 essays * 10 days = 20 days
      expect(screen.getByText(/20 days left/)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all checkboxes when disabled prop is true', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" disabled />);

      expect(screen.getByLabelText(/Letter of Recommendation/)).toBeDisabled();
      expect(screen.getByLabelText(/Transcript Sent/)).toBeDisabled();
      expect(screen.getByLabelText(/Test Scores Sent/)).toBeDisabled();
      expect(screen.getByLabelText(/Financial Aid Documents/)).toBeDisabled();
      expect(screen.getByLabelText(/Main Essay Complete/)).toBeDisabled();
    });

    it('should disable essay inputs when disabled prop is true', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" disabled />);

      expect(screen.getByLabelText(/Total Supplemental Essays:/)).toBeDisabled();
      expect(screen.getByLabelText(/Completed:/)).toBeDisabled();
    });

    it('should not call updateChecklist when checkbox clicked while disabled', () => {
      render(<ChecklistForm checklist={mockChecklist} collegeId="1" disabled />);

      const checkbox = screen.getByLabelText(/Letter of Recommendation/);
      fireEvent.click(checkbox);

      expect(updateChecklist).not.toHaveBeenCalled();
    });
  });

  describe('Null Checklist', () => {
    it('should render with null checklist', () => {
      render(<ChecklistForm checklist={null} collegeId="1" />);

      expect(screen.getByLabelText(/Letter of Recommendation/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Letter of Recommendation/)).not.toBeChecked();
    });

    it('should default essay count to 0 when checklist is null', () => {
      render(<ChecklistForm checklist={null} collegeId="1" />);

      const input = screen.getByLabelText(/Total Supplemental Essays:/);
      expect(input).toHaveValue(0);
    });

    it('should not show supplemental completed when checklist is null', () => {
      render(<ChecklistForm checklist={null} collegeId="1" />);

      expect(screen.queryByLabelText(/Completed:/)).not.toBeInTheDocument();
    });
  });

  describe('Checked States', () => {
    it('should show checked state for completed items', () => {
      const completedChecklist = {
        ...mockChecklist,
        lorTeacher: true,
        transcriptSent: true,
        testScoresSent: true,
        mainEssayComplete: true,
        finaidGreenLight: true,
      };

      render(<ChecklistForm checklist={completedChecklist} collegeId="1" />);

      expect(screen.getByLabelText(/Letter of Recommendation/)).toBeChecked();
      expect(screen.getByLabelText(/Transcript Sent/)).toBeChecked();
      expect(screen.getByLabelText(/Test Scores Sent/)).toBeChecked();
      expect(screen.getByLabelText(/Financial Aid Documents/)).toBeChecked();
      expect(screen.getByLabelText(/Main Essay Complete/)).toBeChecked();
    });

    it('should uncheck item when toggled from checked state', async () => {
      const completedChecklist = {
        ...mockChecklist,
        lorTeacher: true,
      };

      (updateChecklist as jest.Mock).mockResolvedValue({ success: 'Updated!' });

      render(<ChecklistForm checklist={completedChecklist} collegeId="1" />);

      const checkbox = screen.getByLabelText(/Letter of Recommendation/);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(updateChecklist).toHaveBeenCalledWith('1', { lorTeacher: false });
      });
    });
  });
});
