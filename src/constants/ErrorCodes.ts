const ErrorCodes = {
  ERR_01: {
    code: 'ERR_01',
    message: 'Invalid token',
  } as const,
  ERR_02: {
    code: 'ERR_02',
    message: 'Expired token',
  } as const,
  ERR_03: {
    code: 'ERR_03',
    message: 'Invalid auth',
  } as const,
  ERR_04: {
    code: 'ERR_04',
    message: 'In progress Sign up',
  } as const,
  ERR_05: {
    code: 'ERR_05',
    message: 'Waiting for approval',
  } as const,
  ERR_11: {
    code: 'ERR_11',
    message: 'Invalid user information',
  } as const,
  ERR_12: {
    code: 'ERR_12',
    message: 'Invalid instructor information',
  } as const,
  ERR_13: {
    code: 'ERR_13',
    message: 'Invalid member information',
  } as const,
  ERR_14: {
    code: 'ERR_14',
    message: 'Main instructor cannot leave',
  } as const,
  ERR_15: {
    code: 'ERR_15',
    message: "The instructor you're trying to change is the same",
  } as const,
  ERR_32: {
    code: 'ERR_32',
    message: 'Update Profile Parameter Error',
  } as const,
  ERR_41: {
    code: 'ERR_41',
    message: 'Invalid studio information',
  } as const,
};

export default ErrorCodes;
