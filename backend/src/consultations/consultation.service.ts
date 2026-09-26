import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConsultationDto, CaptureViewDto } from './consultation.dto';
import { Consultation } from './consultation.entity';
import { AiService } from '../ai/ai.service';

const fallback = (c: Consultation) => ({
  faceShape: 'Soft oval', texture: c.texture, length: c.length, density: 'Medium-full', movement: 'Natural wave', visibleCondition: 'Moderate',
  signals: [{ label: 'Dryness at ends', level: 'Mild', note: 'A nourishing finish may help the shape sit better.' }, { label: 'Humidity sensitivity', level: 'Noticeable', note: 'Suggest a light anti-frizz routine for Bengaluru weather.' }, { label: 'Scalp visibility', level: 'Balanced', note: 'No unusual visual signal in this estimate.' }],
  recommendations: [{ name: 'Soft textured lob', score: 92, tag: 'Best match', description: 'Keeps the shoulder-grazing ease while letting natural wave do a little work.', chips: ['Low effort', 'Movement'] }, { name: 'Airy collarbone layers', score: 87, tag: 'Close match', description: 'A little more shape through the ends, with a soft frame around the face.', chips: ['Face framing', 'Versatile'] }, { name: 'Long side-swept fringe', score: 76, tag: 'Try if curious', description: 'A gentle change without committing to a shorter overall length.', chips: ['Fresh feel', 'Grow-out friendly'] }],
  services: [{ name: 'Conditioning finish', reason: 'Supports the mild dryness visible at the ends.' }, { name: 'Anti-frizz treatment', reason: 'A lighter routine may help with Bengaluru humidity.' }, { name: 'Signature cut', reason: 'Creates the movement and shape discussed above.' }],
});

@Injectable()
export class ConsultationService {
  constructor(@InjectRepository(Consultation) private readonly repo: Repository<Consultation>, private readonly ai: AiService) {}
  list() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async create(dto: CreateConsultationDto) { const c = this.repo.create({ ...dto, report: null, status: 'draft' }); return this.repo.save(c); }
  async capture(id: string, dto: CaptureViewDto) { const c = await this.get(id); const views = new Set(c.capturedViews.split(',').filter(Boolean)); views.add(dto.view); c.capturedViews = [...views].join(','); return this.repo.save(c); }
  async analyze(id: string, imageBase64?: string) {
    const c = await this.get(id); const report = await this.ai.analyze({ goal: c.goal, texture: c.texture, length: c.length, imageBase64 });
    c.report = report; c.status = 'complete'; return this.repo.save(c);
  }
  async get(id: string) { const c = await this.repo.findOne({ where: { id } }); if (!c) throw new NotFoundException('Consultation not found'); return c; }
}
