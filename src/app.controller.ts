import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guard/JwtAuthGuard';
import { Public } from './public.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'API 상태 확인',
    description: 'API 상태 확인',
  })
  @Public()
  @Get('/heartbreak')
  getHello(): string {
    return this.appService.checkHealth();
  }

  @ApiOperation({
    summary: 'access token 확인',
    description: 'access token 확인',
  })
  @Get('/check-token')
  @UseGuards(JwtAuthGuard)
  checkToken() {
    return this.appService.checkToken();
  }
}
