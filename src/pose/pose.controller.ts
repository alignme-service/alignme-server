import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PoseService } from './pose.service';

@Controller('pose')
export class PoseController {
  constructor(private readonly poseService: PoseService) {}

  @Get(':contentId')
  getPose(@Param('contentId', ParseIntPipe) contentId: number) {
    return this.poseService.getPoseFromContent(contentId);
  }
}
