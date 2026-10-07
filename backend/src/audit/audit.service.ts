import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService implements OnModuleInit {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  record(input: Partial<AuditLog>) {
    return this.repo.save(this.repo.create({ actorEmail: null, actorRole: null, metadata: {}, ...input }));
  }

  async onModuleInit() {
    const days = Math.max(30, Number(process.env.AUDIT_LOG_RETENTION_DAYS || 365));
    await this.repo.createQueryBuilder().delete().where('"createdAt" < :cutoff', { cutoff: new Date(Date.now() - days * 86400000) }).execute();
  }

  list(query: { actorEmail?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 50));
    const builder = this.repo.createQueryBuilder('log').orderBy('log."createdAt"', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    if (query.actorEmail) builder.andWhere('LOWER(log."actorEmail") = LOWER(:actorEmail)', { actorEmail: query.actorEmail.trim() });
    if (query.from) builder.andWhere('log."createdAt" >= :from', { from: query.from });
    if (query.to) builder.andWhere('log."createdAt" <= :to', { to: query.to });
    return builder.getManyAndCount().then(([items, total]) => ({ items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }));
  }
}
