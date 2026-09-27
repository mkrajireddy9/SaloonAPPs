import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  record(input: Partial<AuditLog>) {
    return this.repo.save(this.repo.create({ actorEmail: null, actorRole: null, metadata: {}, ...input }));
  }
}
