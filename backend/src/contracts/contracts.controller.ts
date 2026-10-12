import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { FindContractsQueryDto } from './dto/find-contracts-query.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';
import { ContractResourceDto } from './dto/contract-resource.dto.js';
import { PaginatedContractsResponseDto } from './dto/paginated-contracts-resource.dto.js';
import { EnumResourceDto } from '#common/dto/enum-resource.dto.js';
import { RbacPolicy } from '#rbac/rbac.policy.js';
import {
  EXCEL_MIME_TYPE,
  exportFilename,
} from '#common/excel/excel-export.helper.js';

@Controller('contracts')
@UseGuards(AuthenticationGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  create(
    @Body() createContractDto: CreateContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @Can(RbacPolicy, 'can', () => ['contracts.view'])
  findAll(
    @Query() query: FindContractsQueryDto,
  ): Promise<PaginatedContractsResponseDto> {
    return this.contractsService.findAll(query);
  }

  @Get('types')
  @Can(RbacPolicy, 'can', () => ['contracts.view'])
  getTypes(): EnumResourceDto[] {
    return this.contractsService.getTypes();
  }

  @Get('statuses')
  @Can(RbacPolicy, 'can', () => ['contracts.view'])
  getStatuses(): EnumResourceDto[] {
    return this.contractsService.getStatuses();
  }

  @Get('export')
  @Can(RbacPolicy, 'can', () => ['contracts.view'])
  async export(
    @Query() query: FindContractsQueryDto,
  ): Promise<StreamableFile> {
    const buffer = await this.contractsService.exportToExcel(query);
    return new StreamableFile(buffer, {
      type: EXCEL_MIME_TYPE,
      disposition: `attachment; filename="${exportFilename('contracts')}"`,
    });
  }

  @Get(':id')
  @Can(RbacPolicy, 'can', () => ['contracts.view'])
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.update(id, updateContractDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contractsService.remove(id);
  }

  @Patch(':id/restore')
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.restore(id);
  }

  @Patch(':id/sign')
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() signContractDto: SignContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.sign(id, signContractDto);
  }

  @Patch(':id/decline')
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  decline(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.decline(id);
  }

  @Patch(':id/void')
  @Can(RbacPolicy, 'can', () => ['contracts.manage'])
  void(@Param('id', ParseUUIDPipe) id: string): Promise<ContractResourceDto> {
    return this.contractsService.void(id);
  }
}
