import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { CurrentTenant, CurrentUser } from '../shared/tenancy/current-tenant.decorator.js';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto.js';
import { RequirePermission } from './permissions.guard.js';
import { UsersService, type UserView } from './users.service.js';

/** Staff accounts: Jefe de Control de Calidad only (A-81, Q-83). */
@Controller('users')
@RequirePermission('users.manage')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentTenant() tenantId: string): Promise<UserView[]> {
    return this.users.list(tenantId);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateUserDto): Promise<UserView> {
    return this.users.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserView> {
    return this.users.update(user.tenantId, user.userId, id, dto);
  }

  @Post(':id/password')
  @HttpCode(204)
  async resetPassword(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<void> {
    await this.users.resetPassword(tenantId, id, dto.password);
  }
}
