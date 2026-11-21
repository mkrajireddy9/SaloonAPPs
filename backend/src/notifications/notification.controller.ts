import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { isAdminRole, UserRole } from "../auth/user.entity";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { NotificationService } from "./notification.service";
import { PushService } from "./push.service";
import { PushSubscriptionDto } from "./push-subscription.dto";
import { SendWhatsAppDto } from "./whatsapp.dto";
import { MobilePushService } from "./mobile-push.service";
import { RegisterMobilePushDto } from "./mobile-push.dto";

@Controller("notifications")
@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly service: NotificationService,
    private readonly push: PushService,
    private readonly mobilePush: MobilePushService,
  ) {}
  @Post("whatsapp/send")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Send a manual WhatsApp message to a salon customer" })
  sendWhatsApp(
    @Body() dto: SendWhatsAppDto,
    @Req() request: { user: { salonId?: string } },
  ) {
    if (!request.user.salonId)
      throw new BadRequestException("Salon admin has no assigned salon");
    return this.service.sendManualWhatsApp(dto, request.user.salonId);
  }
  @Post("push/subscribe")
  @ApiOperation({
    summary: "Register the authenticated browser for push notifications",
  })
  subscribe(
    @Body() dto: PushSubscriptionDto,
    @Req()
    request: { user: { sub: string }; headers: { "user-agent"?: string } },
  ) {
    return this.push.subscribe(
      request.user.sub,
      dto,
      request.headers["user-agent"],
    );
  }
  @Post("push/unsubscribe")
  @ApiOperation({ summary: "Disable push notifications for one browser" })
  unsubscribe(
    @Body() dto: PushSubscriptionDto,
    @Req() request: { user: { sub: string } },
  ) {
    return this.push.unsubscribe(request.user.sub, dto.endpoint);
  }
  @Get() @ApiOperation({ summary: "List notification delivery records" }) list(
    @Req()
    request: {
      user: { email: string; role: UserRole; salonId?: string };
    },
  ) {
    return this.service.list(
      request.user.email,
      isAdminRole(request.user.role),
      request.user.salonId,
    );
  }
  @Post("mobile/register")
  @ApiOperation({ summary: "Register this mobile device for push notifications" })
  registerMobile(
    @Body() dto: RegisterMobilePushDto,
    @Req() request: { user: { sub: string; salonId?: string } },
  ) {
    return this.mobilePush.register(request.user.sub, request.user.salonId, dto);
  }
  @Post("mobile/unregister")
  @ApiOperation({ summary: "Disable push notifications for this user" })
  unregisterMobile(
    @Body() body: { expoPushToken?: string },
    @Req() request: { user: { sub: string } },
  ) {
    return this.mobilePush.unregister(request.user.sub, body?.expoPushToken);
  }
  @Get("user")
  @ApiOperation({ summary: "List in-app notifications for the authenticated user" })
  userNotifications(@Req() request: { user: { sub: string; role: UserRole; salonId?: string } }) {
    return this.mobilePush.listForUser(request.user.sub, request.user.role, request.user.salonId);
  }
  @Get("user/unread-count")
  unreadCount(@Req() request: { user: { sub: string } }) {
    return this.mobilePush.unreadCount(request.user.sub).then((count) => ({ count }));
  }
  @Patch("user/:id/read")
  markRead(@Param("id") id: string, @Req() request: { user: { sub: string } }) {
    return this.mobilePush.markRead(request.user.sub, id);
  }
  @Post("user/read-all")
  markAllRead(@Req() request: { user: { sub: string } }) {
    return this.mobilePush.markAllRead(request.user.sub);
  }
  @Post(":id/retry")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Retry a notification delivery (admin only)" })
  retry(
    @Param("id") id: string,
    @Req() request: { user: { salonId?: string } },
  ) {
    return this.service.deliver(id, request.user.salonId);
  }
}
