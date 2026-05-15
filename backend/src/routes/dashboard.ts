import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Loan from '../models/Loan';
import User from '../models/User';

const router = Router();

// GET /api/dashboard/stats (admin)
router.get('/stats', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const [totalBorrowers, applied, sanctioned, disbursed, closed, rejected] = await Promise.all([
      User.countDocuments({ role: 'borrower' }),
      Loan.countDocuments({ status: 'applied' }),
      Loan.countDocuments({ status: 'sanctioned' }),
      Loan.countDocuments({ status: 'disbursed' }),
      Loan.countDocuments({ status: 'closed' }),
      Loan.countDocuments({ status: 'rejected' }),
    ]);
    res.json({ totalBorrowers, applied, sanctioned, disbursed, closed, rejected });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats.', error: err });
  }
});

export default router;
