export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class AuthenticationRequiredError extends ApplicationError {
  constructor() {
    super("Authentication is required to access academic records.", 401, "AUTHENTICATION_REQUIRED");
  }
}
