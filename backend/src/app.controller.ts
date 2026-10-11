import { Controller, Get } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Can.Anyone()
  getHello(): string {
    return this.appService.getHello();
  }
}
