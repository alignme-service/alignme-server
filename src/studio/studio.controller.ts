import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { StudioService } from './studio.service';
import ErrorCodes from '../constants/ErrorCodes';

@Controller('studio')
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  @Get()
  async searchStudios(
    @Query('query') query: string,
    // @Query('page') page: number = 1,
    // @Query('limit') limit: number = 10,
  ) {
    if (!query) {
      throw new BadRequestException(ErrorCodes.ERR_41);
    }
    return await this.studioService.searchStudios(query);
  }
}
