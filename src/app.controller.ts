import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guard/JwtAuthGuard';
import { Public } from './public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/heartbreak')
  getHello(): string {
    return this.appService.checkHealth();
  }

  @Get('/check-token')
  @UseGuards(JwtAuthGuard)
  checkToken() {
    return this.appService.checkToken();
  }
}
