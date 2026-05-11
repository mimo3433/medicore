import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ResponseUtils } from '../../common/utils/response';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;
      const result = await this.paymentService.createPaymentIntent(data.amount, data.currency, data.metadata);
      ResponseUtils.created(res, 'Payment intent created', result);
    } catch (error) {
      next(error);
    }
  };

  confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentIntentId } = req.body;
      const result = await this.paymentService.confirmPayment(paymentIntentId);
      ResponseUtils.success(res, 'Payment confirmed', result);
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.paymentService.getPaymentById(id);
      ResponseUtils.success(res, 'Payment retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const result = await this.paymentService.handleWebhook(req.body, sig);
      ResponseUtils.success(res, 'Webhook processed', result);
    } catch (error) {
      next(error);
    }
  };

  refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const result = await this.paymentService.refundPayment(paymentId);
      ResponseUtils.success(res, 'Refund processed', result);
    } catch (error) {
      next(error);
    }
  };

  getPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const filters = req.query;
      const result = await this.paymentService.getPaymentHistory(userId, filters);
      ResponseUtils.success(res, 'Payment history retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}
