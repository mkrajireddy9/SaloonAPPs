export class CreateMembershipPlanDto {
  name!: string;
  price!: number;
  sessionCount!: number;
  validityDays?: number;
  eligibleServices?: string[];
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
}
