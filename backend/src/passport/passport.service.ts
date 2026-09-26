import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePassportDto } from './passport.dto';
import { Passport } from './passport.entity';

const demoStyles = [
  { name: 'Soft textured lob', meta: 'Saved today · 92 match', tone: 'blush', image: '/images/hair-lob.svg' },
  { name: 'Air-dried movement', meta: 'Saved 14 May · daily style', tone: 'sage', image: '/images/hair-airy.svg' },
  { name: 'Warm espresso gloss', meta: 'Saved 22 Feb · colour note', tone: 'butter', image: '/images/hair-gloss.svg' },
];
const demoHistory = [
  { date: '18 Jun 2024', service: 'Signature cut', detail: 'Meera Nair · Soft textured lob' },
  { date: '14 May 2024', service: 'Gloss refresh', detail: 'Meera Nair · Warm espresso' },
  { date: '02 Mar 2024', service: 'Shape-up', detail: 'Arjun Shah · Air-dried movement' },
];

@Injectable()
export class PassportService {
  constructor(@InjectRepository(Passport) private readonly repo: Repository<Passport>) {}

  async get(ownerEmail = 'guest@halo.local') {
    let passport = await this.repo.findOne({ where: { ownerEmail } });
    if (!passport) passport = await this.repo.save(this.repo.create({ ownerEmail, styles: demoStyles, history: demoHistory, preferences: ['Low maintenance', 'Soft movement', 'Warm tones'], notes: 'Prefers low-maintenance shapes that still feel polished for work.' }));
    return passport;
  }

  async update(ownerEmail: string, dto: UpdatePassportDto) {
    const passport = await this.get(ownerEmail);
    Object.assign(passport, dto);
    return this.repo.save(passport);
  }
}
