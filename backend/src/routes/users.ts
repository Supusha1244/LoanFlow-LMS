import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// GET /api/users (admin only - list all users)
router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err });
  }
});

// GET /api/users/borrowers (sales module - borrowers who haven't applied)
router.get('/borrowers', authenticate, authorize('sales', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const Loan = (await import('../models/Loan')).default;
    // Get all borrowers
    const borrowers = await User.find({ role: 'borrower' }).select('-password').sort({ createdAt: -1 });
    // Get borrowers who have loans
    const loansWithBorrowers = await Loan.find({}).distinct('borrower');
    const appliedBorrowerIds = new Set(loansWithBorrowers.map((id) => id.toString()));

    const result = borrowers.map((b) => ({
      ...b.toObject(),
      hasApplied: appliedBorrowerIds.has(b._id.toString()),
    }));

    res.json({ borrowers: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch borrowers.', error: err });
  }
});

export default router;
