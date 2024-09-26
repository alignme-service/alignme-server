import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateInstructorDto } from './dto/createInstructor.dto';
import { CreateManagerDto } from './dto/createManager.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { updateProfileImageDto } from './dto/updateProfileImage';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({
    summary: '강사 회원가입',
    description: '강사 회원가입',
  })
  @ApiBody({ type: CreateInstructorDto })
  @UseGuards(JwtAuthGuard)
  @Post('/signup-instructor')
  createInstructor(@Body() createInstructor: CreateInstructorDto) {
    return this.profileService.createInstructor(createInstructor);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/signup-manager')
  createManager(@Body() cereateManager: CreateManagerDto) {
    return this.profileService.createManager(cereateManager);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '프로필 이미지 업데이트',
    type: updateProfileImageDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Post('update')
  async saveImage(
    @Body('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.profileService.saveImage(+userId, file);
  }

  @ApiOperation({
    summary: '마이페이지 정보',
    description: '마이페이지 정보',
  })
  @ApiQuery({ name: 'userId', description: '유저 아이디' })
  @UseGuards(JwtAuthGuard)
  @Get()
  myPageInfo(@Query('userId') userId: string) {
    return this.profileService.getMypageInfo(+userId);
  }
}
