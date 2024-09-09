import { Body, Controller, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateInstructorDto } from './dto/CreateInstructor.dto';
import { CreateManagerDto } from './dto/createManager.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('/signup-instructor')
  createInstructor(@Body() createInstructor: CreateInstructorDto) {
    return this.profileService.createInstructor(createInstructor);
  }

  @Post('/signup-manager')
  createManager(@Body() cereateManager: CreateManagerDto){
    return this.profileService.createManager(cereateManager);
  }
}
