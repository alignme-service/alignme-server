import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  checkHealth(): string {
    return 'GOOD!';
  }

  checkToken() {
    return 'valid token';
  }
}
