import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permission } from './permission.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination } from '@/common/dto/ResponseWrap';
import {
  ApiPaginatedResponse,
  ApiResponseArrayWrap,
  ApiResponseWrap,
} from '@/common/decorator/swagger';
import { HttpCommonDataProvider } from '@/common/provider/HttpCommonDataProvider';
import { createQueryWrapper } from '@/utils/query';
import { responseSuccess } from '@/utils/result';
import { TaskService } from '@/common/schedule/task.service';
import { uniqBy } from 'lodash';
import { NotNeedLogin } from '@/common/decorator/NotNeedLogin';

@ApiTags('菜单权限表 permission')
@Controller('permission')
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly httpCommonDataProvider: HttpCommonDataProvider,
    private readonly taskService: TaskService,
  ) {}

  @Get('/page')
  @ApiOperation({ summary: '获取系统默认菜单列表' })
  @ApiResponseArrayWrap(Permission)
  @NotNeedLogin()
  async page(@Query() query: Permission) {
    query.tenantId = this.httpCommonDataProvider.getTenantId();
    query.id = query.id || '1';
    const entity = await this.permissionService.findOne(query);
    const res = await this.permissionService.findTree(entity);
    return responseSuccess([res]);
  }

  @Post('/create')
  @ApiResponseWrap(Permission)
  async create(@Body() dto: Permission) {
    dto.tenantId = this.httpCommonDataProvider.getTenantId();
    if (dto.parentId) {
      dto.parent = new Permission();
      dto.parent.id = dto.parentId;
    }
    return responseSuccess(await this.permissionService.create(dto));
  }

  @Get('get')
  @ApiResponseWrap(Permission)
  async findOne(@Query('id') id: string) {
    return responseSuccess(await this.permissionService.findOne({ id }));
  }

  @Post('/update')
  @ApiResponseWrap(Permission)
  async update(@Body() dto: Permission) {
    if (dto.parentId) {
      dto.parent = new Permission();
      dto.parent.id = dto.parentId;
    }
    return responseSuccess(await this.permissionService.update(dto.id, dto));
  }

  @Post('/remove/:id')
  async remove(@Param('id') id: string) {
    return responseSuccess(await this.permissionService.remove(id));
  }

  @Post('/getCurrentUserPermissions')
  @ApiOperation({ summary: '获取个人的权限菜单，需前端自己转化树和权限code' })
  @ApiResponseArrayWrap(Permission)
  async getMyPermissions() {
    const { roleIds } = this.httpCommonDataProvider.getTokenData();
    const roles = this.taskService
      .getRoles()
      .filter((v) => roleIds.includes(v.id));
    let permissions: Permission[] = [];
    roles.forEach((v) => {
      permissions.push(...v.permissions);
    });
    permissions = uniqBy(permissions, 'id');
    return responseSuccess(permissions);
  }
}
