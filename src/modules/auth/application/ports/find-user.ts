export interface FindUserPort {
  findUserId(username: string): Promise<string | null>;
}
