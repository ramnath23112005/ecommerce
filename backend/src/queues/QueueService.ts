import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { config } from '../config';
import logger from '../utils/logger';

const connection: ConnectionOptions = {
  url: config.redis.url,
};

export enum QueueNames {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  INVENTORY = 'inventory',
  ORDER = 'order',
  PAYMENT = 'payment',
}

class QueueService {
  private queues = new Map<string, Queue>();
  private workers: Worker[] = [];

  getQueue(name: QueueNames): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  async addJob<T = any>(queueName: QueueNames, jobName: string, data: T, opts?: {
    delay?: number;
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  }): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, {
      attempts: opts?.attempts ?? 3,
      backoff: opts?.backoff ?? { type: 'exponential', delay: 1000 },
      removeOnComplete: opts?.removeOnComplete ?? true,
      removeOnFail: opts?.removeOnFail ?? false,
      delay: opts?.delay,
    });
  }

  registerWorker(
    queueName: QueueNames,
    handler: (job: Job) => Promise<void>,
    concurrency = 5
  ): void {
    const worker = new Worker(queueName, handler, {
      connection,
      concurrency,
      limiter: { max: 100, duration: 1000 },
    });

    worker.on('completed', (job: Job) => {
      logger.info(`[Queue] ${queueName}:${job.name} completed (id=${job.id})`);
    });

    worker.on('failed', (job: Job | undefined, error: Error) => {
      logger.error(`[Queue] ${queueName}:${job?.name} failed (id=${job?.id}): ${error.message}`);
    });

    worker.on('error', (error: Error) => {
      logger.error(`[Queue] ${queueName} worker error: ${error.message}`);
    });

    this.workers.push(worker);
    logger.info(`[Queue] Worker registered for ${queueName} (concurrency=${concurrency})`);
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await Promise.all(Array.from(this.queues.values()).map((q) => q.close()));
    logger.info('[Queue] All queues and workers closed');
  }
}

export const queueService = new QueueService();
