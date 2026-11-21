import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class RegisterMobilePushDto {
  @IsString()
  @IsNotEmpty()
  expoPushToken!: string;

  @IsString()
  @IsIn(["android", "ios", "web", "unknown"])
  deviceType!: "android" | "ios" | "web" | "unknown";
}
