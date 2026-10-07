import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { UserRole } from '../auth/user.entity';
import { CreatePaymentDto, PaymentWebhookDto, RefundPaymentDto, VerifyRazorpayPaymentDto } from './payment.dto';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(Payment) private readonly payments: Repository<Payment>, @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>) {}

  private canAccess(payment: Payment, user: { email: string; role: UserRole; salonId?: string }) {
    if (user.role === UserRole.ADMIN && user.salonId && payment.salonId !== user.salonId) throw new ForbiddenException('You cannot access this payment');
    if (user.role !== UserRole.ADMIN && payment.guestEmail !== user.email) throw new ForbiddenException('You cannot access this payment');
  }

  async list(user: { email: string; role: UserRole; salonId?: string }) {
    return this.payments.find({ where: user.role === UserRole.ADMIN ? { salonId: user.salonId || undefined } : { guestEmail: user.email, salonId: user.salonId || undefined }, order: { createdAt: 'DESC' } });
  }

  async create(dto: CreatePaymentDto, user: { email: string; role: UserRole; salonId?: string }) {
    const existing = await this.payments.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) { this.canAccess(existing, user); return existing; }
    const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId, ...(user.role === UserRole.ADMIN && user.salonId ? { salonId: user.salonId } : {}) } });
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
    if (!paymentsEnabled) return this.payments.save(this.payments.create({ salonId: appointment.salonId || user.salonId || null, appointmentId: appointment.id, guestEmail: appointment.guestEmail, provider, paymentMethod: 'PAY_AT_SALON', providerPaymentId: null, idempotencyKey: dto.idempotencyKey, currency: 'INR', subtotal, discount, tax, total, status: 'Pending', invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`, paidAt: null, refundedAt: null }));
    const localMode = provider === 'local' || provider === 'pay_at_salon';
    if (provider === 'razorpay') {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new ConflictException('Razorpay is not configured on the server');
      const razorpayReceipt = `halo_${appointment.id.slice(0, 8)}_${Date.now()}`;
      const response = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'content-type': 'application/json' }, body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt: razorpayReceipt, notes: { appointmentId: appointment.id, idempotencyKey: dto.idempotencyKey } }) });
      if (!response.ok) { const providerBody = await response.text(); throw new ConflictException(`Razorpay could not create the payment order (${response.status}): ${providerBody.slice(0, 180)}`); }
      const order = await response.json() as { id: string };
      const payment = await this.payments.save(this.payments.create({ salonId: appointment.salonId || user.salonId || null, appointmentId: appointment.id, guestEmail: appointment.guestEmail, provider, paymentMethod: 'ONLINE', providerPaymentId: order.id, idempotencyKey: dto.idempotencyKey, currency: 'INR', subtotal, discount, tax, total, status: 'Pending', invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`, paidAt: null, refundedAt: null }));
      return { payment, razorpay: { keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: Math.round(total * 100), currency: 'INR' } };
    }
    let providerPaymentId = `${localMode ? 'pi_local_' : 'pi_pending_'}${Date.now()}`;
    let paymentStatus: Payment['status'] = localMode ? 'Paid' : 'Pending';
    if (!localMode && process.env.PAYMENT_PROVIDER_URL) {
      const response = await fetch(process.env.PAYMENT_PROVIDER_URL, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.PAYMENT_PROVIDER_SECRET ? { authorization: `Bearer ${process.env.PAYMENT_PROVIDER_SECRET}` } : {}) }, body: JSON.stringify({ amount: total, currency: 'INR', idempotencyKey: dto.idempotencyKey, appointmentId: appointment.id }) });
      if (!response.ok) throw new ConflictException('Payment provider could not create the payment intent');
      const result = await response.json() as { id?: string; status?: string };
      providerPaymentId = result.id || providerPaymentId;
      paymentStatus = result.status === 'paid' ? 'Paid' : 'Pending';
    }
    return this.payments.save(this.payments.create({ salonId: appointment.salonId || user.salonId || null, appointmentId: appointment.id, guestEmail: appointment.guestEmail, provider, paymentMethod: 'ONLINE', providerPaymentId, idempotencyKey: dto.idempotencyKey, currency: 'INR', subtotal, discount, tax, total, status: paymentStatus, invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`, paidAt: paymentStatus === 'Paid' ? new Date() : null, refundedAt: null }));
  }

  async verifyRazorpay(dto: VerifyRazorpayPaymentDto, user: { email: string; role: UserRole; salonId?: string }) {
    if (!process.env.RAZORPAY_KEY_SECRET) throw new UnauthorizedException('Razorpay is not configured on the server');
    const payment = await this.payments.findOne({ where: { providerPaymentId: dto.razorpayOrderId } });
    if (!payment) throw new NotFoundException('Razorpay payment order not found');
    this.canAccess(payment, user);
    const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`).digest('hex');
    if (expected !== dto.razorpaySignature) throw new UnauthorizedException('Razorpay payment signature is invalid');
    payment.providerPaymentId = dto.razorpayPaymentId;
    payment.status = 'Paid';
    payment.paidAt = new Date();
    return this.payments.save(payment);
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

  async refund(id: string, dto: RefundPaymentDto, salonId?: string) {
    const payment = await this.payments.findOne({ where: { id, ...(salonId ? { salonId } : {}) } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'Paid') throw new ConflictException('Only paid payments can be refunded');
    payment.status = 'Refunded'; payment.refundedAt = new Date();
    return this.payments.save(payment);
  }
}
