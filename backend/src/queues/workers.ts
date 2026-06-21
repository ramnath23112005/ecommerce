import { Job } from 'bullmq';
import { queueService, QueueNames } from './QueueService';
import { sendEmail } from '../utils/email';
import logger from '../utils/logger';

export function registerWorkers(): void {
  queueService.registerWorker(QueueNames.EMAIL, async (job: Job) => {
    const { to, subject, html, template, data } = job.data;
    await sendEmail({ to, subject, html, template, data });
  });

  queueService.registerWorker(QueueNames.INVENTORY, async (job: Job) => {
    const { action, payload } = job.data;
    switch (action) {
      case 'reserve':
        logger.info(`[Worker] Reserving inventory: ${JSON.stringify(payload)}`);
        break;
      case 'release':
        logger.info(`[Worker] Releasing inventory: ${JSON.stringify(payload)}`);
        break;
      case 'check_low_stock':
        logger.info(`[Worker] Checking low stock: ${JSON.stringify(payload)}`);
        break;
      default:
        logger.warn(`[Worker] Unknown inventory action: ${action}`);
    }
  });

  queueService.registerWorker(QueueNames.NOTIFICATION, async (job: Job) => {
    const { type, recipient, message } = job.data;
    logger.info(`[Worker] Notification ${type} to ${recipient}: ${message}`);
  });

  queueService.registerWorker(QueueNames.ORDER, async (job: Job) => {
    const { action, orderId, orderNumber } = job.data;
    logger.info(`[Worker] Order ${action}: ${orderNumber} (${orderId})`);
  });

  queueService.registerWorker(QueueNames.PAYMENT, async (job: Job) => {
    const { action, paymentId, orderId, amount } = job.data;
    logger.info(`[Worker] Payment ${action}: ${paymentId} for order ${orderId}, amount ${amount}`);
  });

  logger.info('[Queue] All workers registered');
}
