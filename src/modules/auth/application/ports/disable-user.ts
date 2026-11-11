export interface DisableUserPort {
  disableUser(id: string): Promise<boolean>;
}
