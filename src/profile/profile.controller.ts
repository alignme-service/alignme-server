import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { updateProfileImageDto } from './dto/updateProfileImage';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accessToken = request.cookies['accessToken'];

    if (!accessToken) {
      throw new Error('No access token provided');
    }

    return await this.profileService.saveImage(accessToken, file);
  }

  @ApiOperation({
    summary: '마이페이지 정보',
    description: '마이페이지 정보',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  myPageInfo(@Req() request: Request) {
    const accessToken = request.cookies['accessToken'];

    if (!accessToken) {
      throw new Error('No access token provided');
    }

    return this.profileService.getMypageInfo(accessToken);
  }
}
