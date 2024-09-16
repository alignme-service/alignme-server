import { Controller } from '@nestjs/common';
import { StudioService } from './studio.service';

@Controller('studio')
export class StudioController {
  constructor(private readonly studioService: StudioService) {}
}
