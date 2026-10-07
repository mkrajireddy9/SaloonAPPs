import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
export class PushSubscriptionDto { @IsUrl({ require_tld: false }) endpoint!: string; @IsNotEmpty() @IsString() p256dh!: string; @IsNotEmpty() @IsString() auth!: string; }
