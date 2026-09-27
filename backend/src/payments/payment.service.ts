import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { UserRole } from '../auth/user.entity';
import { CreatePaymentDto, PaymentWebhookDto, RefundPaymentDto } from './payment.dto';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(Payment) private readonly payments: Repository<Payment>, @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>) {}

  private canAccess(payment: Payment, user: { email: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN && payment.guestEmail !== user.email) throw new ForbiddenException('You cannot access this payment');
  }

  async list(user: { email: string; role: UserRole }) {
    return this.payments.find({ where: user.role === UserRole.ADMIN ? {} : { guestEmail: user.email }, order: { createdAt: 'DESC' } });
  }

  async create(dto: CreatePaymentDto, user: { email: string; role: UserRole }) {
    const existing = await this.payments.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) { this.canAccess(existing, user); return existing; }
    const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (user.role !== UserRole.ADMIN && appointment.guestEmail !== user.email) throw new ForbiddenException('You cannot pay for this appointment');
    if (appointment.status === 'Cancelled') throw new ConflictException('Cancelled appointments cannot be paid');
    const subtotal = Math.max(0, Number(appointment.price || 0));
    // Discounts must come from the server-side appointment/catalog state, never from the client payload.
    const discount = 0;
    const tax = Math.round((subtotal - discount) * Number(process.env.PAYMENT_TAX_RATE || 0));
    const total = subtotal - discount + tax;
    const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
    const provider = paymentsEnabled ? (process.env.PAYMENT_PROVIDER || 'local') : 'pay_at_salon';
    if (!paymentsEnabled) return this.payments.save(this.payments.create({ appointmentId: appointment.id, guestEmail: appointment.guestEmail, provider, paymentMethod: 'PAY_AT_SALON', providerPaymentId: null, idempotencyKey: dto.idempotencyKey, currency: 'INR', subtotal, discount, tax, total, status: 'Pending', invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`, paidAt: null, refundedAt: null }));
    const localMode = provider === 'local';
    let providerPaymentId = `${localMode ? 'pi_local_' : 'pi_pending_'}${Date.now()}`;
    let paymentStatus: Payment['status'] = localMode ? 'Paid' : 'Pending';
    if (!localMode && process.env.PAYMENT_PROVIDER_URL) {
      const response = await fetch(process.env.PAYMENT_PROVIDER_URL, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.PAYMENT_PROVIDER_SECRET ? { authorization: `Bearer ${process.env.PAYMENT_PROVIDER_SECRET}` } : {}) }, body: JSON.stringify({ amount: total, currency: 'INR', idempotencyKey: dto.idempotencyKey, appointmentId: appointment.id }) });
      if (!response.ok) throw new ConflictException('Payment provider could not create the payment intent');
      const result = await response.json() as { id?: string; status?: string };
      providerPaymentId = result.id || providerPaymentId;
      paymentStatus = result.status === 'paid' ? 'Paid' : 'Pending';
    }
    return this.payments.save(this.payments.create({ appointmentId: appointment.id, guestEmail: appointment.guestEmail, provider, paymentMethod: 'ONLINE', providerPaymentId, idempotencyKey: dto.idempotencyKey, currency: 'INR', subtotal, discount, tax, total, status: paymentStatus, invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`, paidAt: paymentStatus === 'Paid' ? new Date() : null, refundedAt: null }));
  }

  async webhook(dto: PaymentWebhookDto, secret?: string) {
    if (process.env.PAYMENT_WEBHOOK_SECRET && secret !== process.env.PAYMENT_WEBHOOK_SECRET) throw new UnauthorizedException('Invalid payment webhook secret');
    const payment = await this.payments.findOne({ where: { providerPaymentId: dto.providerPaymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    payment.status = dto.status === 'paid' ? 'Paid' : dto.status === 'refunded' ? 'Refunded' : 'Failed';
    if (payment.status === 'Paid') payment.paidAt = payment.paidAt || new Date();
    if (payment.status === 'Refunded') payment.refundedAt = new Date();
    return this.payments.save(payment);
  }

  async refund(id: string, dto: RefundPaymentDto) {
    const payment = await this.payments.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'Paid') throw new ConflictException('Only paid payments can be refunded');
    payment.status = 'Refunded'; payment.refundedAt = new Date();
    return this.payments.save(payment);
  }
}
