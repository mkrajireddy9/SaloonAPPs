import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';
import { CreateReviewDto, UpdateReviewStatusDto } from './review.dto';
import { ReviewService } from './review.service';

@Controller('reviews') @ApiTags('reviews') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly service: ReviewService) {}
  @Get() @ApiOperation({ summary: 'List published reviews or all reviews for admins' }) list(@Req() request: { user: { email: string; role: UserRole } }) { return this.service.list(request.user); }
  @Post() @ApiOperation({ summary: 'Submit a review for moderation' }) create(@Body() dto: CreateReviewDto, @Req() request: { user: { email: string; name: string } }) { return this.service.create(dto, request.user); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Publish or reject a review' }) updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) { return this.service.updateStatus(id, dto); }
}
