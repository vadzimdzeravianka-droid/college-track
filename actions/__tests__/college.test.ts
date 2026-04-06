import {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  updateCollegeStatus,
  updateChecklist,
} from '../college';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(),
    college: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    checklist: {
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue('test-user-123'),
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-123'),
}));

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Server Actions - college.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getColleges', () => {
    it('should return colleges with checklists ordered by deadline', async () => {
      const mockColleges = [
        {
          id: '1',
          name: 'MIT',
          category: 'REACH',
          status: 'NOT_STARTED',
          strategy: 'ED',
          deadlineApp: new Date('2024-11-01'),
          costTuition: 50000,
          checklist: { id: 'c1', lorTeacher: false },
        },
        {
          id: '2',
          name: 'Stanford',
          category: 'REACH',
          status: 'IN_PROGRESS',
          strategy: 'RD',
          deadlineApp: new Date('2025-01-01'),
          costTuition: null,
          checklist: { id: 'c2', lorTeacher: true },
        },
      ];

      (db.college.findMany as jest.Mock).mockResolvedValue(mockColleges);

      const result = await getColleges();

      expect(result.colleges).toBeDefined();
      expect(result.colleges).toHaveLength(2);
      expect(result.colleges?.[0].name).toBe('MIT');
      expect(result.colleges?.[0].costTuition).toBe(50000);
      expect(result.colleges?.[1].costTuition).toBeNull();
      expect(db.college.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-123' },
        include: { checklist: true },
        orderBy: { deadlineApp: 'asc' },
      });
    });

    it('should handle colleges with all cost fields', async () => {
      const mockCollege = {
        id: '1',
        name: 'Test College',
        costTuition: 60000,
        costRoomBoard: 15000,
        costFees: 2000,
        costBooks: 1000,
        costPersonal: 3000,
        costOther: 500,
        checklist: null,
      };

      (db.college.findMany as jest.Mock).mockResolvedValue([mockCollege]);

      const result = await getColleges();

      expect(result.colleges?.[0].costTuition).toBe(60000);
      expect(result.colleges?.[0].costRoomBoard).toBe(15000);
      expect(result.colleges?.[0].costFees).toBe(2000);
      expect(result.colleges?.[0].costBooks).toBe(1000);
      expect(result.colleges?.[0].costPersonal).toBe(3000);
      expect(result.colleges?.[0].costOther).toBe(500);
    });

    it('should handle database errors', async () => {
      (db.college.findMany as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

      const result = await getColleges();

      expect(result.error).toBe('Failed to fetch colleges');
      expect(result.details).toBe('DB connection failed');
    });

    it('should return empty array when no colleges exist', async () => {
      (db.college.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getColleges();

      expect(result.colleges).toEqual([]);
    });
  });

  describe('getCollegeById', () => {
    it('should return college with checklist when found', async () => {
      const mockCollege = {
        id: '1',
        name: 'MIT',
        category: 'REACH',
        costTuition: 50000,
        checklist: { id: 'c1', lorTeacher: true },
      };

      (db.college.findFirst as jest.Mock).mockResolvedValue(mockCollege);

      const result = await getCollegeById('1');

      expect(result.college).toBeDefined();
      expect(result.college.name).toBe('MIT');
      expect(result.college.costTuition).toBe(50000);
      expect(db.college.findFirst).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-123' },
        include: { checklist: true },
      });
    });

    it('should return error when college not found', async () => {
      (db.college.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getCollegeById('nonexistent');

      expect(result.error).toBe('College not found');
      expect(result.college).toBeUndefined();
    });

    it('should handle database errors', async () => {
      (db.college.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await getCollegeById('1');

      expect(result.error).toBe('Failed to fetch college');
    });
  });

  describe('createCollege', () => {
    it('should create college with valid data', async () => {
      const validData = {
        name: 'Harvard',
        category: 'REACH' as const,
        status: 'NOT_STARTED' as const,
        strategy: 'RD' as const,
      };

      const mockCreatedCollege = {
        id: '1',
        ...validData,
        deadlineApp: null,
        deadlineFinaid: null,
        checklist: { id: 'c1' },
      };

      (db.college.create as jest.Mock).mockResolvedValue(mockCreatedCollege);

      const result = await createCollege(validData);

      expect(result.success).toBe('College added!');
      expect(result.college).toBeDefined();
      expect(db.college.create).toHaveBeenCalledWith({
        data: {
          name: 'Harvard',
          category: 'REACH',
          status: 'NOT_STARTED',
          strategy: 'RD',
          userId: 'test-user-123',
          deadlineApp: null,
          deadlineFinaid: null,
          checklist: { create: {} },
        },
        include: { checklist: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should create college with deadline dates', async () => {
      const validData = {
        name: 'Yale',
        category: 'REACH' as const,
        status: 'NOT_STARTED' as const,
        strategy: 'ED' as const,
        deadlineApp: '2024-11-01',
        deadlineFinaid: '2024-11-15',
      };

      const mockCreatedCollege = {
        id: '1',
        ...validData,
        checklist: { id: 'c1' },
      };

      (db.college.create as jest.Mock).mockResolvedValue(mockCreatedCollege);

      const result = await createCollege(validData);

      expect(result.success).toBe('College added!');
      expect(db.college.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'test-user-123',
            deadlineApp: expect.any(Date),
            deadlineFinaid: expect.any(Date),
          }),
        })
      );
    });

    it('should return error for invalid data', async () => {
      const invalidData = {
        name: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: 'INVALID' as any,
        status: 'NOT_STARTED' as const,
        strategy: 'RD' as const,
      };

      const result = await createCollege(invalidData);

      expect(result.error).toBe('Invalid data');
      expect(db.college.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const validData = {
        name: 'Test',
        category: 'MATCH' as const,
        status: 'NOT_STARTED' as const,
        strategy: 'RD' as const,
      };

      (db.college.create as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'));

      const result = await createCollege(validData);

      expect(result.error).toBe('Failed to create college');
      expect(result.details).toBe('Unique constraint failed');
    });
  });

  describe('updateCollege', () => {
    it('should update college with partial data using transaction', async () => {
      const mockUpdatedCollege = {
        id: '1',
        name: 'MIT Updated',
        checklist: { id: 'c1' },
      };

      const mockTx = {
        college: {
          update: jest.fn().mockResolvedValue(mockUpdatedCollege),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateCollege('1', { name: 'MIT Updated' });

      expect(result.success).toBe('College updated!');
      expect(result.college).toBeDefined();
      expect(mockTx.college.update).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-123' },
        data: { name: 'MIT Updated' },
        include: { checklist: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(revalidatePath).toHaveBeenCalledWith('/college/1');
    });

    it('should update deadline dates', async () => {
      const mockUpdatedCollege = { id: '1', checklist: null };

      const mockTx = {
        college: {
          update: jest.fn().mockResolvedValue(mockUpdatedCollege),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateCollege('1', {
        deadlineApp: '2024-12-01',
        deadlineFinaid: '2024-12-15',
      });

      expect(result.success).toBe('College updated!');
      expect(mockTx.college.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deadlineApp: expect.any(Date),
            deadlineFinaid: expect.any(Date),
          }),
        })
      );
    });

    it('should return error when college not found', async () => {
      const mockTx = {
        college: {
          update: jest.fn().mockRejectedValue(new Error('Record to update not found.')),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateCollege('nonexistent', { name: 'Test' });

      expect(result.error).toBe('Failed to update college');
    });

    it('should handle database errors', async () => {
      (db.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await updateCollege('1', { name: 'Test' });

      expect(result.error).toBe('Failed to update college');
    });

    describe('Transaction behavior', () => {
      it('should use transaction for atomic update', async () => {
        const mockTx = {
          college: {
            update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated', checklist: null }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateCollege('1', { name: 'Updated' });

        // Verify transaction was used
        expect(db.$transaction).toHaveBeenCalled();
        // Verify single update call (optimized pattern)
        expect(mockTx.college.update).toHaveBeenCalledTimes(1);
      });

      it('should rollback on update failure', async () => {
        const mockTx = {
          college: {
            update: jest.fn().mockRejectedValue(new Error('Update failed mid-transaction')),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateCollege('1', { name: 'Test' });

        expect(result.error).toBe('Failed to update college');
        // Revalidation should not occur on failure
        expect(revalidatePath).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteCollege', () => {
    it('should delete college successfully using transaction', async () => {
      const mockTx = {
        college: {
          delete: jest.fn().mockResolvedValue({ id: '1', name: 'MIT' }),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await deleteCollege('1');

      expect(result.success).toBe('College deleted!');
      expect(mockTx.college.delete).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-123' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should return error when college not found', async () => {
      const mockTx = {
        college: {
          delete: jest.fn().mockRejectedValue(new Error('Record to delete not found.')),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await deleteCollege('nonexistent');

      expect(result.error).toBe('Failed to delete college');
    });

    it('should handle database errors', async () => {
      (db.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await deleteCollege('1');

      expect(result.error).toBe('Failed to delete college');
    });

    describe('Transaction behavior', () => {
      it('should use transaction for atomic delete', async () => {
        const mockTx = {
          college: {
            delete: jest.fn().mockResolvedValue({ id: '1', name: 'MIT' }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await deleteCollege('1');

        // Verify transaction was used
        expect(db.$transaction).toHaveBeenCalled();
        // Verify delete was called with proper parameters
        expect(mockTx.college.delete).toHaveBeenCalledWith({
          where: { id: '1', userId: 'test-user-123' },
        });
      });

      it('should handle cascade delete of checklist within transaction', async () => {
        const mockTx = {
          college: {
            // Prisma automatically cascades delete to checklist
            delete: jest.fn().mockResolvedValue({ id: '1', name: 'MIT' }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await deleteCollege('1');

        expect(result.success).toBe('College deleted!');
        // Checklist cascade is handled by Prisma automatically
        expect(mockTx.college.delete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('updateCollegeStatus', () => {
    it('should update status successfully', async () => {
      const mockUpdatedCollege = {
        id: '1',
        status: 'IN_PROGRESS',
        checklist: { id: 'c1' },
      };

      const mockTx = {
        college: {
          update: jest.fn().mockResolvedValue(mockUpdatedCollege),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateCollegeStatus('1', 'IN_PROGRESS');

      expect(result.success).toBe('Status updated!');
      expect(result.college).toBeDefined();
      expect(mockTx.college.update).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-123' },
        data: { status: 'IN_PROGRESS' },
        include: { checklist: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/college/1');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle all status values', async () => {
      const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'WAITLISTED', 'ACCEPTED', 'DECLINED'] as const;

      for (const status of statuses) {
        const mockTx = {
          college: {
            update: jest.fn().mockResolvedValue({ id: '1', status, checklist: null }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateCollegeStatus('1', status);

        expect(result.success).toBe('Status updated!');
        expect(result.college?.status).toBe(status);
      }
    });

    it('should return error when college not found', async () => {
      const mockTx = {
        college: {
          update: jest.fn().mockRejectedValue(new Error('Record to update not found.')),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateCollegeStatus('1', 'SUBMITTED');

      expect(result.error).toBe('Failed to update status');
    });

    it('should handle database errors', async () => {
      (db.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await updateCollegeStatus('1', 'SUBMITTED');

      expect(result.error).toBe('Failed to update status');
    });

    describe('Transaction behavior', () => {
      it('should use transaction for atomic status update', async () => {
        const mockTx = {
          college: {
            update: jest.fn().mockResolvedValue({ id: '1', status: 'SUBMITTED', checklist: null }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateCollegeStatus('1', 'SUBMITTED');

        // Verify transaction was used
        expect(db.$transaction).toHaveBeenCalled();
        // Verify single update call (optimized pattern)
        expect(mockTx.college.update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('updateChecklist', () => {
    const mockCollege = {
      id: '1',
      status: 'NOT_STARTED',
      checklist: {
        id: 'c1',
        collegeId: '1',
        lorTeacher: false,
        transcriptSent: false,
        testScoresSent: false,
        essayCount: 2,
        mainEssayComplete: false,
        supplementalEssaysCompleted: 0,
        finaidGreenLight: false,
      },
    };

    describe('Transaction rollback', () => {
      it('should rollback checklist update if status update fails', async () => {
        // Mock transaction that simulates checklist update succeeding but status update failing
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue(mockCollege),
            update: jest.fn().mockRejectedValue(new Error('Status update failed')),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              ...mockCollege.checklist,
              lorTeacher: true,
            }),
          },
        };

        (db.$transaction as jest.Mock) = jest.fn(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateChecklist('1', { lorTeacher: true });

        // Should return error
        expect(result.error).toContain('Failed to update checklist');
        // Transaction should have been attempted
        expect(db.$transaction).toHaveBeenCalled();
      });

      it('should preserve error messages from transaction failures', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockRejectedValue(new Error('Database connection lost')),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateChecklist('1', { lorTeacher: true });

        // Should preserve the specific error message
        expect(result.error).toContain('Database connection lost');
      });

      it('should handle "College not found" within transaction', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateChecklist('1', { lorTeacher: true });

        // Should preserve the "not found" error message
        expect(result.error).toContain('College not found or unauthorized');
      });

      it('should rollback if checklist create fails', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              ...mockCollege,
              checklist: null, // No existing checklist
            }),
            update: jest.fn(),
          },
          checklist: {
            create: jest.fn().mockRejectedValue(new Error('Unique constraint violation')),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        const result = await updateChecklist('1', { lorTeacher: true });

        // Should return error and not call college update
        expect(result.error).toContain('Unique constraint violation');
        expect(mockTx.college.update).not.toHaveBeenCalled();
      });
    });

    it('should update existing checklist', async () => {
      const mockTx = {
        college: {
          findFirst: jest.fn().mockResolvedValue(mockCollege),
          update: jest.fn().mockResolvedValue({ ...mockCollege, status: 'IN_PROGRESS' }),
        },
        checklist: {
          update: jest.fn().mockResolvedValue({
            ...mockCollege.checklist,
            lorTeacher: true,
          }),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateChecklist('1', { lorTeacher: true });

      expect(result.success).toBe('Checklist updated!');
      expect(mockTx.college.findFirst).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-123' },
        include: { checklist: true },
      });
      expect(mockTx.checklist.update).toHaveBeenCalledWith({
        where: { collegeId: '1' },
        data: { lorTeacher: true },
      });
    });

    it('should create checklist if it does not exist', async () => {
      const mockTx = {
        college: {
          findFirst: jest.fn().mockResolvedValue({
            ...mockCollege,
            checklist: null,
          }),
          update: jest.fn().mockResolvedValue({ ...mockCollege, status: 'IN_PROGRESS' }),
        },
        checklist: {
          create: jest.fn().mockResolvedValue({
            id: 'c1',
            collegeId: '1',
            lorTeacher: true,
          }),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateChecklist('1', { lorTeacher: true });

      expect(result.success).toBe('Checklist updated!');
      expect(mockTx.checklist.create).toHaveBeenCalledWith({
        data: { collegeId: '1', lorTeacher: true },
      });
    });

    describe('Auto-status progression', () => {
      it('should progress from NOT_STARTED to IN_PROGRESS on first update', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue(mockCollege),
            update: jest.fn().mockResolvedValue({
              ...mockCollege,
              status: 'IN_PROGRESS',
            }),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              ...mockCollege.checklist,
              lorTeacher: true,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { lorTeacher: true });

        expect(mockTx.college.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'IN_PROGRESS' },
        });
      });

      it('should progress from IN_PROGRESS to SUBMITTED when all items complete', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              ...mockCollege,
              status: 'IN_PROGRESS',
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              id: 'c1',
              collegeId: '1',
              lorTeacher: true,
              transcriptSent: true,
              testScoresSent: true,
              essayCount: 2,
              mainEssayComplete: true,
              supplementalEssaysCompleted: 2,
              finaidGreenLight: true,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { finaidGreenLight: true });

        expect(mockTx.college.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'SUBMITTED' },
        });
      });

      it('should revert from SUBMITTED to IN_PROGRESS when item unchecked', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              id: '1',
              status: 'SUBMITTED',
              checklist: {
                id: 'c1',
                collegeId: '1',
                lorTeacher: true,
                transcriptSent: true,
                testScoresSent: true,
                essayCount: 0,
                mainEssayComplete: true,
                supplementalEssaysCompleted: 0,
                finaidGreenLight: true,
              },
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              id: 'c1',
              lorTeacher: false,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { lorTeacher: false });

        expect(mockTx.college.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'IN_PROGRESS' },
        });
      });

      it('should not change status for WAITLISTED', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              ...mockCollege,
              status: 'WAITLISTED',
            }),
            update: jest.fn(),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              ...mockCollege.checklist,
              lorTeacher: true,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { lorTeacher: true });

        expect(mockTx.college.update).not.toHaveBeenCalled();
      });

      it('should not change status for ACCEPTED', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              ...mockCollege,
              status: 'ACCEPTED',
            }),
            update: jest.fn(),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              ...mockCollege.checklist,
              lorTeacher: true,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { lorTeacher: true });

        expect(mockTx.college.update).not.toHaveBeenCalled();
      });

      it('should not change status for DECLINED', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              ...mockCollege,
              status: 'DECLINED',
            }),
            update: jest.fn(),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({
              ...mockCollege.checklist,
              lorTeacher: true,
            }),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { lorTeacher: true });

        expect(mockTx.college.update).not.toHaveBeenCalled();
      });

      it('should handle 0 essays (all complete when essayCount is 0)', async () => {
        const mockTx = {
          college: {
            findFirst: jest.fn().mockResolvedValue({
              id: '1',
              status: 'IN_PROGRESS',
              checklist: {
                ...mockCollege.checklist,
                lorTeacher: true,
                transcriptSent: true,
                testScoresSent: true,
                mainEssayComplete: true,
                finaidGreenLight: true,
                essayCount: 0,
                supplementalEssaysCompleted: 0,
              },
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          checklist: {
            update: jest.fn().mockResolvedValue({}),
          },
        };

        (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(mockTx);
        });

        await updateChecklist('1', { finaidGreenLight: true });

        expect(mockTx.college.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { status: 'SUBMITTED' },
        });
      });
    });

    it('should return error when college not found', async () => {
      const mockTx = {
        college: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await updateChecklist('nonexistent', { lorTeacher: true });

      expect(result.error).toContain('College not found or unauthorized');
    });

    it('should handle database errors', async () => {
      (db.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await updateChecklist('1', { lorTeacher: true });

      expect(result.error).toContain('Failed to update checklist');
    });

    it('should revalidate paths after update', async () => {
      const mockTx = {
        college: {
          findFirst: jest.fn().mockResolvedValue(mockCollege),
          update: jest.fn().mockResolvedValue({ ...mockCollege, status: 'IN_PROGRESS' }),
        },
        checklist: {
          update: jest.fn().mockResolvedValue({
            ...mockCollege.checklist,
            lorTeacher: true,
          }),
        },
      };

      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await updateChecklist('1', { lorTeacher: true });

      expect(revalidatePath).toHaveBeenCalledWith('/college/1');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    });
  });
});
