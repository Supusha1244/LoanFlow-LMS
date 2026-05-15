import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Payment from '../models/Payment';
import Loan from '../models/Loan';

const router = Router();

// POST /api/payments (record a payment)
router.post('/', authenticate, authorize('collection', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { loanId, utrNumber, amount, paymentDate } = req.body;

    if (!loanId || !utrNumber || !amount || !paymentDate) {
      res.status(400).json({ message: 'loanId, utrNumber, amount and paymentDate are required.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) { res.status(404).json({ message: 'Loan not found.' }); return; }
    if (loan.status !== 'disbursed') {
      res.status(400).json({ message: 'Payments can only be recorded for disbursed loans.' });
      return;
    }

    // Check UTR uniqueness
    const existingUTR = await Payment.findOne({ utrNumber });
    if (existingUTR) {
      res.status(409).json({ message: 'UTR number already exists. Each payment must have a unique UTR.' });
      return;
    }

    // Validate payment amount
    const outstanding = loan.totalRepayment - loan.totalPaid;
    if (amount <= 0) {
      res.status(400).json({ message: 'Payment amount must be greater than 0.' });
      return;
    }
    if (amount > outstanding) {
      res.status(400).json({ message: `Payment amount (₹${amount}) exceeds outstanding balance (₹${outstanding.toFixed(2)}).` });
      return;
    }

    const payment = await Payment.create({
      loan: loanId,
      borrower: loan.borrower,
      utrNumber,
      amount,
      paymentDate: new Date(paymentDate),
      recordedBy: req.user?.userId,
    });

    // Update loan totalPaid
    loan.totalPaid = loan.totalPaid + amount;

    // Auto-close if fully paid
    if (Math.abs(loan.totalPaid - loan.totalRepayment) < 0.01) {
      loan.status = 'closed';
      loan.closedAt = new Date();
    }

    await loan.save();

    res.status(201).json({
      payment,
      loanStatus: loan.status,
      totalPaid: loan.totalPaid,
      outstanding: loan.totalRepayment - loan.totalPaid,
      message: loan.status === 'closed' ? 'Payment recorded. Loan is now CLOSED!' : 'Payment recorded successfully.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payment.', error: err });
  }
});

// GET /api/payments/loan/:loanId
router.get('/loan/:loanId', authenticate, authorize('collection', 'admin', 'borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ loan: req.params.loanId })
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments.', error: err });
  }
});

export default router;
