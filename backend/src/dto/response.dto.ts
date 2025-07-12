export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error(message = 'Error'): ApiResponse {
    return new ApiResponse(false, message);
  }
}

export class LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: any;
    token: string;
  };
}

export class RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
  };
}
