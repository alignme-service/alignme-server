import { HttpException, HttpStatus } from '@nestjs/common';
import { Express } from 'express';

export function imageFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  // 파일 확장자 검사
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }

  // MIME 타입 검사
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new HttpException(
        'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }

  callback(null, true);
}
