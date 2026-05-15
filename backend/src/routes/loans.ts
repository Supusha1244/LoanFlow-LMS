import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Loan from '../models/Loan';
import { runBRE } from '../utils/bre';
import { calculateLoan } from '../utils/loanCalc';

const router = Router();

// POST /api/loans/check-eligibility (BRE check)
router.post('/check-eligibility', authenticate, authorize('borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const { dateOfBirth, monthlySalary, pan, employmentMode } = req.body;
    const result = runBRE({ dateOfBirth: new Date(dateOfBirth), monthlySalary, pan, employmentMode });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'BRE check failed.', error: err });
  }
});

// POST /api/loans/apply
router.post('/apply', authenticate, authorize('borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName, pan, dateOfBirth, monthlySalary, employmentMode,
      loanAmount, tenure, salarySlipUrl, salarySlipOriginalName,
    } = req.body;

    // Re-run BRE on server
    const breResult = runBRE({ dateOfBirth: new Date(dateOfBirth), monthlySalary, pan, employmentMode });
    if (!breResult.passed) {
      res.status(422).json({ message: 'BRE check failed.', errors: breResult.errors });
      return;
    }

    const { simpleInterest, totalRepayment } = calculateLoan(loanAmount, tenure);

    const loan = await Loan.create({
      borrower: req.user?.userId,
      fullName,
      pan: pan.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary,
      employmentMode,
      loanAmount,
      tenure,
      interestRate: 12,
      simpleInterest,
      totalRepayment,
      status: 'applied',
      salarySlipUrl,
      salarySlipOriginalName,
      totalPaid: 0,
    });

    res.status(201).json({ loan, message: 'Loan application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Loan application failed.', error: err });
  }
});

// GET /api/loans/my-loans (borrower)
router.get('/my-loans', authenticate, authorize('borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const loans = await Loan.find({ borrower: req.user?.userId }).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loans.', error: err });
  }
});

// GET /api/loans/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrower', 'name email').populate('sanctionedBy', 'name').populate('disbursedBy', 'name');
    if (!loan) { res.status(404).json({ message: 'Loan not found.' }); return; }
    // Borrowers can only see their own loans
    if (req.user?.role === 'borrower' && loan.borrower._id.toString() !== req.user.userId) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    res.json({ loan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loan.', error: err });
  }
});

// PATCH /api/loans/:id/sanction
router.patch('/:id/sanction', authenticate, authorize('sanction', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const loan = await Loan.findById(req.params.id);
    if (!loan) { res.status(404).json({ message: 'Loan not found.' }); return; }
    if (loan.status !== 'applied') {
      res.status(400).json({ message: 'Only applied loans can be sanctioned or rejected.' });
      return;
    }
    if (action === 'approve') {
      loan.status = 'sanctioned';
      loan.sanctionedBy = req.user?.userId as unknown as import('mongoose').Types.ObjectId;
      loan.sanctionedAt = new Date();
    } else if (action === 'reject') {
      if (!rejectionReason) { res.status(400).json({ message: 'Rejection reason is required.' }); return; }
      loan.status = 'rejected';
      loan.rejectionReason = rejectionReason;
    } else {
      res.status(400).json({ message: 'Action must be approve or reject.' });
      return;
    }
    await loan.save();
    res.json({ loan, message: `Loan ${action === 'approve' ? 'sanctioned' : 'rejected'} successfully.` });
  } catch (err) {
    res.status(500).json({ message: 'Sanction action failed.', error: err });
  }
});

// PATCH /api/loans/:id/disburse
router.patch('/:id/disburse', authenticate, authorize('disbursement', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) { res.status(404).json({ message: 'Loan not found.' }); return; }
    if (loan.status !== 'sanctioned') {
      res.status(400).json({ message: 'Only sanctioned loans can be disbursed.' });
      return;
    }
    loan.status = 'disbursed';
    loan.disbursedBy = req.user?.userId as unknown as import('mongoose').Types.ObjectId;
    loan.disbursedAt = new Date();
    await loan.save();
    res.json({ loan, message: 'Loan disbursed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Disbursement failed.', error: err });
  }
});

// GET /api/loans (for ops dashboard)
router.get('/', authenticate, authorize('admin', 'sales', 'sanction', 'disbursement', 'collection'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const loans = await Loan.find(filter).populate('borrower', 'name email').populate('sanctionedBy', 'name').populate('disbursedBy', 'name').sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loans.', error: err });
  }
});

export default router;
