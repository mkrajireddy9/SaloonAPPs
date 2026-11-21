import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "../auth/user.entity";
import { SalonService } from "../salon/salon.service";
import { Salon } from "../salon/salon.entity";
import { SalonWishlist } from "./wishlist.entity";

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(SalonWishlist) private readonly wishlists: Repository<SalonWishlist>,
    private readonly salons: SalonService,
    @InjectRepository(Salon) private readonly salonRepository: Repository<Salon>,
  ) {}

  private ensureCustomer(user: { role?: UserRole }) {
    if (user.role !== UserRole.USER) throw new UnauthorizedException("Customer wishlist access required");
  }

  async list(user: { id: string; role?: UserRole }, latitude?: number, longitude?: number) {
    this.ensureCustomer(user);
    const saved = await this.wishlists.find({ where: { userId: user.id }, order: { createdAt: "DESC" } });
    if (!saved.length) return [];
    const publicSalons = await this.salons.listPublic(latitude, longitude, Number.MAX_SAFE_INTEGER);
    const publicById = new Map(publicSalons.map((salon) => [salon.id, salon]));
    return saved
      .map((item) => ({ ...item, salon: publicById.get(item.salonId) || null }))
      .filter((item) => item.salon);
  }

  async add(salonId: string, user: { id: string; role?: UserRole }) {
    this.ensureCustomer(user);
    const salon = await this.salonRepository.findOne({ where: { id: salonId, active: true } });
    if (!salon) throw new NotFoundException("Salon not found");
    const existing = await this.wishlists.findOne({ where: { userId: user.id, salonId } });
    if (existing) return { salonId, saved: true };
    try {
      await this.wishlists.save(this.wishlists.create({ userId: user.id, salonId }));
    } catch (error) {
      if ((error as { code?: string })?.code === "23505") throw new ConflictException("Salon is already in your wishlist");
      throw error;
    }
    return { salonId, saved: true };
  }

  async remove(salonId: string, user: { id: string; role?: UserRole }) {
    this.ensureCustomer(user);
    await this.wishlists.delete({ userId: user.id, salonId });
    return { salonId, saved: false };
  }
}
