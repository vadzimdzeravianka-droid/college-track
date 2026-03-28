import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusActions } from '../status-actions';
import { updateCollegeStatus } from '@/actions/college';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/actions/college', () => ({
  updateCollegeStatus: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StatusActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SUBMITTED status', () => {
    it('should show three decision buttons for SUBMITTED status', () => {
      render(<StatusActions collegeId="123" currentStatus="SUBMITTED" />);

      expect(screen.getByRole('button', { name: /waitlisted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /accepted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /declined/i })).toBeInTheDocument();
    });

    it('should call updateCollegeStatus when Waitlisted clicked', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ success: 'Status updated!' });

      render(<StatusActions collegeId="123" currentStatus="SUBMITTED" />);

      const waitlistedButton = screen.getByRole('button', { name: /waitlisted/i });
      fireEvent.click(waitlistedButton);

      await waitFor(() => {
        expect(updateCollegeStatus).toHaveBeenCalledWith('123', 'WAITLISTED');
      });
    });

    it('should call updateCollegeStatus when Accepted clicked', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ success: 'Status updated!' });

      render(<StatusActions collegeId="456" currentStatus="SUBMITTED" />);

      const acceptedButton = screen.getByRole('button', { name: /accepted/i });
      fireEvent.click(acceptedButton);

      await waitFor(() => {
        expect(updateCollegeStatus).toHaveBeenCalledWith('456', 'ACCEPTED');
      });
    });

    it('should call updateCollegeStatus when Declined clicked', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ success: 'Status updated!' });

      render(<StatusActions collegeId="789" currentStatus="SUBMITTED" />);

      const declinedButton = screen.getByRole('button', { name: /declined/i });
      fireEvent.click(declinedButton);

      await waitFor(() => {
        expect(updateCollegeStatus).toHaveBeenCalledWith('789', 'DECLINED');
      });
    });

    it('should show success toast on successful status change', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ success: 'Status updated!' });

      render(<StatusActions collegeId="123" currentStatus="SUBMITTED" />);

      fireEvent.click(screen.getByRole('button', { name: /accepted/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Status updated!');
      });
    });

    it('should show error toast on failed status change', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ error: 'Update failed' });

      render(<StatusActions collegeId="123" currentStatus="SUBMITTED" />);

      fireEvent.click(screen.getByRole('button', { name: /accepted/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('should disable buttons while update is pending', async () => {
      (updateCollegeStatus as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: 'Done' }), 100))
      );

      render(<StatusActions collegeId="123" currentStatus="SUBMITTED" />);

      const acceptedButton = screen.getByRole('button', { name: /accepted/i });
      fireEvent.click(acceptedButton);

      // Buttons should be disabled during update
      expect(screen.getByRole('button', { name: /waitlisted/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /accepted/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /declined/i })).toBeDisabled();
    });
  });

  describe('Final status (WAITLISTED, ACCEPTED, DECLINED)', () => {
    it('should show Back button for WAITLISTED status', () => {
      render(<StatusActions collegeId="123" currentStatus="WAITLISTED" />);

      expect(screen.getByRole('button', { name: /back to submitted/i })).toBeInTheDocument();
      expect(screen.getByText(/WAITLISTED/)).toBeInTheDocument();
    });

    it('should show Back button for ACCEPTED status', () => {
      render(<StatusActions collegeId="123" currentStatus="ACCEPTED" />);

      expect(screen.getByRole('button', { name: /back to submitted/i })).toBeInTheDocument();
      expect(screen.getByText(/ACCEPTED/)).toBeInTheDocument();
    });

    it('should show Back button for DECLINED status', () => {
      render(<StatusActions collegeId="123" currentStatus="DECLINED" />);

      expect(screen.getByRole('button', { name: /back to submitted/i })).toBeInTheDocument();
      expect(screen.getByText(/DECLINED/)).toBeInTheDocument();
    });

    it('should revert to SUBMITTED when Back button clicked', async () => {
      (updateCollegeStatus as jest.Mock).mockResolvedValue({ success: 'Status updated!' });

      render(<StatusActions collegeId="123" currentStatus="ACCEPTED" />);

      const backButton = screen.getByRole('button', { name: /back to submitted/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(updateCollegeStatus).toHaveBeenCalledWith('123', 'SUBMITTED');
      });
    });

    it('should disable Back button while update is pending', async () => {
      (updateCollegeStatus as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: 'Done' }), 100))
      );

      render(<StatusActions collegeId="123" currentStatus="WAITLISTED" />);

      const backButton = screen.getByRole('button', { name: /back to submitted/i });
      fireEvent.click(backButton);

      // Button should be disabled during update
      expect(backButton).toBeDisabled();
    });
  });

  describe('Auto-managed statuses (NOT_STARTED, IN_PROGRESS)', () => {
    it('should render nothing for NOT_STARTED status', () => {
      const { container } = render(<StatusActions collegeId="123" currentStatus="NOT_STARTED" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing for IN_PROGRESS status', () => {
      const { container } = render(<StatusActions collegeId="123" currentStatus="IN_PROGRESS" />);

      expect(container.firstChild).toBeNull();
    });
  });
});
