export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export interface RefreshJwtPayload extends JwtPayload {
  tokenId: string; // id of the RefreshToken row, for revocation lookups
}
