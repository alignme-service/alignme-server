import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

@Injectable()
export class UtilsService {
  getUUID() {
    return v4();
  }

  formUrlEncoded(x: any) {
    return Object.keys(x).reduce(
      (p, c) => p + `&${c}=${encodeURIComponent(x[c])}`,
      '',
    );
  }
}
