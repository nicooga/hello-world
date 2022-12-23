export interface PasswordHasher {
    hash(s: string): string
}