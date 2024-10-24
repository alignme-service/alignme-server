import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../user/types/userRole';

export const ROLES_KEY = 'roles';
export const MAIN_INSTRUCTOR_KEY = 'isMainInstructor';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const MainInstructor = () => SetMetadata(MAIN_INSTRUCTOR_KEY, true);
