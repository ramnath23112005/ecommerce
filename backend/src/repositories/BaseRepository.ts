import { Model, Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { IRepository } from '../interfaces';

export class BaseRepository<T extends Document> implements IRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findAll(query: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(query).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(query: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async findOne(query: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(query).exec();
  }

  async findWithPagination(
    query: FilterQuery<T> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      select?: string;
      populate?: any;
    } = {}
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(options.select || '')
        .populate(options.populate || '')
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }
}
