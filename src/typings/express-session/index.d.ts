import "express-session";
declare module "express-session" {
  interface SessionData {
    siwe?: any;
    nonce?: string | null;
  }
}
