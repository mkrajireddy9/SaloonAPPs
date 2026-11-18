import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "crypto";
import { Repository } from "typeorm";
import { User, UserRole } from "../auth/user.entity";
import { Salon } from "../salon/salon.entity";
import { Coupon } from "./coupon.entity";
import { Referral } from "./referral.entity";
import { ClaimReferralDto, CreateCouponDto, UpdateCouponDto, UpdateReferralSettingsDto, ValidateCouponDto } from "./rewards.dto";

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Salon) private readonly salons: Repository<Salon>,
    @InjectRepository(Coupon) private readonly coupons: Repository<Coupon>,
    @InjectRepository(Referral) private readonly referrals: Repository<Referral>,
  ) {}

  private async referralFor(userId: string, salonId: string) {
    let referral = await this.referrals.findOne({ where: { referrerId: userId, salonId } });
    if (!referral) {
      const salon = await this.salons.findOne({ where: { id: salonId } });
      referral = await this.referrals.save(this.referrals.create({
        code: `HALO-${randomBytes(4).toString("hex").toUpperCase()}`,
        referrerId: userId,
        salonId,
        referredId: null,
        status: "claimed",
        rewardAmount: salon?.referralRewardAmount ?? 100,
        completedAt: null,
      }));
    }
    return referral;
  }

  async summary(user: { id: string; role: UserRole }, salonId?: string) {
    if (user.role !== UserRole.USER) throw new UnauthorizedException("Customer rewards only");
    const customer = await this.users.findOne({ where: { id: user.id, role: UserRole.USER } });
    if (!customer) throw new NotFoundException("Customer account not found");
    if (!salonId) return { referralCode: null, referralStatus: null, referralReward: 0, referralCredits: 0, message: "Open rewards from a salon to use its referral program." };
    const referral = await this.referralFor(user.id, salonId);
    const completed = await this.referrals.find({ where: { referrerId: user.id, salonId, status: "completed" } });
    return {
      referralCode: referral.code,
      referralStatus: referral.status,
      referralReward: referral.rewardAmount,
      referralCredits: completed.reduce((total, item) => total + item.rewardAmount, 0),
    };
  }

  async claimReferral(dto: ClaimReferralDto, user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.USER) throw new UnauthorizedException("Customer rewards only");
    const referral = await this.referrals.findOne({
      where: dto.salonId
        ? { code: dto.code.trim().toUpperCase(), salonId: dto.salonId }
        : { code: dto.code.trim().toUpperCase() },
    });
    if (!referral) throw new NotFoundException("Referral code not found");
    if (referral.referrerId === user.id) throw new ConflictException("You cannot use your own referral code");
    if (referral.referredId && referral.referredId !== user.id)
      throw new ConflictException("This referral code has already been used");
    referral.referredId = user.id;
    await this.referrals.save(referral);
    return { message: "Referral applied. Your friend will receive a reward after your first paid visit." };
  }

  async createCoupon(dto: CreateCouponDto, user: { salonId?: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN || !user.salonId)
      throw new UnauthorizedException("Salon admin access required");
    if (dto.discountType === "percent" && dto.discountValue > 100)
      throw new ConflictException("Percentage discount cannot exceed 100");
    return this.coupons.save(this.coupons.create({
      salonId: user.salonId,
      code: dto.code.trim().toUpperCase(),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxUses: dto.maxUses || null,
      usedCount: 0,
      active: true,
      startsAt: null,
      endsAt: null,
    }));
  }

  async listCoupons(user: { salonId?: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN || !user.salonId)
      throw new UnauthorizedException("Salon admin access required");
    const [coupons, salon] = await Promise.all([
      this.coupons.find({ where: { salonId: user.salonId }, order: { createdAt: "DESC" } }),
      this.salons.findOne({ where: { id: user.salonId } }),
    ]);
    return { coupons, referralRewardAmount: salon?.referralRewardAmount ?? 100 };
  }

  async updateReferralSettings(dto: UpdateReferralSettingsDto, user: { salonId?: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN || !user.salonId)
      throw new UnauthorizedException("Salon admin access required");
    const salon = await this.salons.findOne({ where: { id: user.salonId } });
    if (!salon) throw new NotFoundException("Salon not found");
    salon.referralRewardAmount = dto.rewardAmount;
    return { referralRewardAmount: (await this.salons.save(salon)).referralRewardAmount };
  }

  async updateCoupon(id: string, dto: UpdateCouponDto, user: { salonId?: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN || !user.salonId)
      throw new UnauthorizedException("Salon admin access required");
    const coupon = await this.coupons.findOne({ where: { id, salonId: user.salonId } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    coupon.active = dto.active;
    return this.coupons.save(coupon);
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.coupons.findOne({ where: { code: dto.code.trim().toUpperCase(), active: true } });
    if (!coupon || (coupon.salonId && dto.salonId && coupon.salonId !== dto.salonId))
      throw new NotFoundException("Coupon code is invalid or unavailable");
    const now = new Date();
    if ((coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now))
      throw new ConflictException("This coupon is not active");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      throw new ConflictException("This coupon has reached its usage limit");
    const subtotal = Math.max(0, Number(dto.subtotal || 0));
    const discount = coupon.discountType === "percent"
      ? Math.min(subtotal, Math.round(subtotal * coupon.discountValue / 100))
      : Math.min(subtotal, coupon.discountValue);
    return { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount };
  }

  async listAvailableCoupons(salonId: string) {
    if (!salonId) return [];
    return this.coupons.find({
      where: { salonId, active: true },
      select: ["id", "code", "discountType", "discountValue", "maxUses", "usedCount", "startsAt", "endsAt"],
      order: { createdAt: "DESC" },
    }).then((coupons) => {
      const now = new Date();
      return coupons.filter((coupon) =>
        (!coupon.startsAt || coupon.startsAt <= now) &&
        (!coupon.endsAt || coupon.endsAt >= now) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses),
      );
    });
  }

  async applyCoupon(code: string | undefined, salonId: string, subtotal: number) {
    if (!code) return { discount: 0, coupon: null as Coupon | null };
    const result = await this.validateCoupon({ code, salonId, subtotal });
    const coupon = await this.coupons.findOne({ where: { code: result.code, salonId } });
    if (!coupon) throw new NotFoundException("Coupon code is invalid for this salon");
    coupon.usedCount += 1;
    await this.coupons.save(coupon);
    return { discount: result.discount, coupon };
  }

  async completeReferral(guestEmail: string, salonId: string) {
    const customer = await this.users.findOne({ where: { email: guestEmail, role: UserRole.USER } });
    if (!customer) return;
    const referral = await this.referrals.findOne({ where: { referredId: customer.id, salonId, status: "claimed" } });
    if (!referral) return;
    referral.status = "completed";
    referral.completedAt = new Date();
    await this.referrals.save(referral);
    // Credits are calculated from completed referrals per salon in summary().
  }
}
