import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isAdminRole, User, UserRole } from "../auth/user.entity";
import { CreateMembershipDto, CreateMembershipPlanDto, UseMembershipDto } from "./membership.dto";
import { Membership, MembershipPlan, MembershipUsage } from "./membership.entity";

type RequestUser = { id: string; email: string; role: UserRole; salonId?: string };

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipPlan) private readonly plans: Repository<MembershipPlan>,
    @InjectRepository(Membership) private readonly memberships: Repository<Membership>,
    @InjectRepository(MembershipUsage) private readonly usages: Repository<MembershipUsage>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private requireSalon(user: RequestUser) {
    if (!isAdminRole(user.role) || !user.salonId)
      throw new ForbiddenException("A salon administrator is required");
    return user.salonId;
  }

  private async withDetails(items: Membership[]) {
    const planIds = [...new Set(items.map((item) => item.planId))];
    const plans = await this.plans.findByIds(planIds);
    const planMap = new Map(plans.map((plan) => [plan.id, plan]));
    const usage = await this.usages.find({ where: items.length ? { membershipId: items.map((item) => item.id) as any } : undefined, order: { usedAt: "DESC" } });
    return items.map((item) => ({ ...item, plan: planMap.get(item.planId) || null, usage: usage.filter((entry) => entry.membershipId === item.id) }));
  }

  async listPlans(salonId?: string, user?: RequestUser) {
    if (isAdminRole(user?.role)) {
      const ownSalon = this.requireSalon(user!);
      return this.plans.find({ where: { salonId: ownSalon }, order: { createdAt: "DESC" } });
    }
    if (!salonId) return [];
    return this.plans.find({ where: { salonId, active: true }, order: { createdAt: "DESC" } });
  }

  async createPlan(dto: CreateMembershipPlanDto, user: RequestUser) {
    const salonId = this.requireSalon(user);
    if (!dto.name?.trim() || Number(dto.sessionCount) < 1)
      throw new ConflictException("Plan name and at least one session are required");
    return this.plans.save(this.plans.create({
      salonId,
      name: dto.name.trim(),
      price: Math.max(0, Number(dto.price) || 0),
      sessionCount: Math.max(1, Number(dto.sessionCount)),
      validityDays: Math.max(1, Number(dto.validityDays) || 30),
      eligibleServices: (dto.eligibleServices || []).map((item) => item.trim()).filter(Boolean),
    }));
  }

  async listMine(user: RequestUser) {
    const memberships = await this.memberships.find({ where: { guestEmail: user.email }, order: { createdAt: "DESC" } });
    const today = new Date().toISOString().slice(0, 10);
    for (const item of memberships) {
      if (item.status === "active" && (item.expiresAt < today || item.remainingSessions <= 0)) {
        item.status = item.remainingSessions <= 0 ? "exhausted" : "expired";
        await this.memberships.save(item);
      }
    }
    return this.withDetails(memberships);
  }

  async issue(dto: CreateMembershipDto, user: RequestUser) {
    const salonId = this.requireSalon(user);
    const plan = await this.plans.findOne({ where: { id: dto.planId, salonId, active: true } });
    if (!plan) throw new NotFoundException("Membership plan not found");
    const customer = await this.users.findOne({ where: { email: dto.guestEmail.trim().toLowerCase(), role: UserRole.USER } });
    if (!customer) throw new NotFoundException("Guest account not found");
    const start = dto.startsAt || new Date().toISOString().slice(0, 10);
    const expiry = new Date(`${start}T00:00:00Z`);
    expiry.setUTCDate(expiry.getUTCDate() + plan.validityDays);
    const membership = await this.memberships.save(this.memberships.create({
      salonId, customerId: customer.id, guestEmail: customer.email, planId: plan.id,
      amountPaid: Math.max(0, Number(dto.amountPaid ?? plan.price) || 0), totalSessions: plan.sessionCount,
      remainingSessions: plan.sessionCount, startsAt: start, expiresAt: expiry.toISOString().slice(0, 10), status: "active",
    }));
    return (await this.withDetails([membership]))[0];
  }

  async listSalonMembers(user: RequestUser) {
    const salonId = this.requireSalon(user);
    return this.withDetails(await this.memberships.find({ where: { salonId }, order: { createdAt: "DESC" } }));
  }

  async use(id: string, dto: UseMembershipDto, user: RequestUser) {
    const salonId = this.requireSalon(user);
    const membership = await this.memberships.findOne({ where: { id, salonId } });
    if (!membership) throw new NotFoundException("Membership not found");
    if (membership.status !== "active" || membership.remainingSessions < 1)
      throw new ConflictException("This membership has no remaining sessions");
    const plan = await this.plans.findOne({ where: { id: membership.planId } });
    if (plan?.eligibleServices?.length && !plan.eligibleServices.some((item) => item.toLowerCase() === dto.service.trim().toLowerCase()))
      throw new ConflictException("This service is not included in the membership");
    membership.remainingSessions -= 1;
    if (!membership.remainingSessions) membership.status = "exhausted";
    await this.memberships.save(membership);
    await this.usages.save(this.usages.create({ membershipId: id, salonId, appointmentId: dto.appointmentId || null, service: dto.service.trim(), serviceCost: Math.max(0, Number(dto.serviceCost) || 0), usedByEmail: user.email }));
    return (await this.withDetails([membership]))[0];
  }
}
