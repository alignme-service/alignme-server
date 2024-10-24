import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { updateProfileImageDto } from './dto/updateProfileImage';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';
import { GetAccessToken } from '../decorators/get-access-token.decorator';
import CheckPendingUserGuard from '../guard/checkPendingUser.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UseGuards(CheckPendingUserGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '프로필  업데이트',
    type: updateProfileImageDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(200)
  @Post('update')
  async saveImage(
    @Body() body: { userName: string },
    @UploadedFile() file: Express.Multer.File,
    @GetAccessToken() accessToken: string,
  ) {
    return await this.profileService.updateProfile(
      body.userName,
      file,
      accessToken,
    );
  }

  @ApiOperation({
    summary: '마이페이지 정보',
    description: '마이페이지 정보',
  })
  @Get()
  myPageInfo(@GetAccessToken() accessToken: string) {
    return this.profileService.getMypageInfo(accessToken);
  }
}
