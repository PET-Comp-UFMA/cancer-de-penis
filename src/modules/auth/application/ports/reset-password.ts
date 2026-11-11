export interface ResetPasswordPort {
  resetPassword(id: string, password: string): Promise<boolean>;
}
