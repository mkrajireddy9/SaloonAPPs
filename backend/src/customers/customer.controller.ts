import { Body, Controller, Get, Param, Patch, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';
import { CustomerHistoryQueryDto, UpdateCustomerProfileDto } from './customer.dto';
import { CustomerService } from './customer.service';

@Controller('customers') @ApiTags('customers') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Get('me') @ApiOperation({ summary: 'Get the current customer profile' }) me(@Req() request: any) { return this.service.getProfile(request.user); }
  @Patch('me') @ApiOperation({ summary: 'Update the current customer profile' }) updateMe(@Req() request: any, @Body() dto: UpdateCustomerProfileDto) { return this.service.updateProfile(request.user, dto); }
  @Get('me/history') @ApiOperation({ summary: 'Get the current customer appointment history' }) myHistory(@Req() request: any, @Query() query: CustomerHistoryQueryDto) { return this.service.history(request.user, query); }
  @Get(':id/history') @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Get a customer appointment history (admin only)' }) customerHistory(@Param('id') id: string, @Query() query: CustomerHistoryQueryDto, @Req() request: any) { return this.service.customerHistory(id, query, request.user.salonId); }
  @Get() @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Search and filter customer records (admin only)' }) list(@Query() query: CustomerHistoryQueryDto, @Req() request: any) { return this.service.list(query, request.user.salonId); }
  @Get('export') @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Export filtered customer records as CSV' }) async export(@Query() query: CustomerHistoryQueryDto, @Res() response: any, @Req() request: any) { response.header('Content-Type', 'text/csv'); response.header('Content-Disposition', 'attachment; filename="customers.csv"'); response.send(await this.service.exportCsv(query, request.user.salonId)); }
}
