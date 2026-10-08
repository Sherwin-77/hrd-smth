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
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { FindContractsQueryDto } from './dto/find-contracts-query.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';
import { ContractResourceDto } from './dto/contract-resource.dto.js';
import { ContractTypeDto } from './dto/contract-type.dto.js';
import { PaginatedContractsResponseDto } from './dto/paginated-contracts-resource.dto.js';

@Controller('contracts')
@UseGuards(AuthenticationGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(
    @Body() createContractDto: CreateContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  findAll(
    @Query() query: FindContractsQueryDto,
  ): Promise<PaginatedContractsResponseDto> {
    return this.contractsService.findAll(query);
  }

  @Get('types')
  getTypes(): ContractTypeDto[] {
    return this.contractsService.getTypes();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.update(id, updateContractDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contractsService.remove(id);
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.restore(id);
  }

  @Patch(':id/sign')
  sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() signContractDto: SignContractDto,
  ): Promise<ContractResourceDto> {
    return this.contractsService.sign(id, signContractDto);
  }

  @Patch(':id/decline')
  decline(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResourceDto> {
    return this.contractsService.decline(id);
  }

  @Patch(':id/void')
  void(@Param('id', ParseUUIDPipe) id: string): Promise<ContractResourceDto> {
    return this.contractsService.void(id);
  }
}
