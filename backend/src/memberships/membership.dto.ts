export class CreateMembershipPlanDto {
  name!: string;
  price!: number;
  sessionCount!: number;
  validityDays?: number;
  eligibleServices?: string[];
}

export class UpdateMembershipDto {
  amountPaid?: number;
  remainingSessions?: number;
  expiresAt?: string;
  status?: "active" | "cancelled";
}

export class CreateMembershipDto {
  planId!: string;
  guestEmail!: string;
  amountPaid?: number;
  startsAt?: string;
}

export class UseMembershipDto {
  service!: string;
  serviceCost?: number;
  appointmentId?: string;
  sessionsUsed?: number;
}
