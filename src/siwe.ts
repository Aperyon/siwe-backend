import { SiweMessage } from "siwe";

const domain = process.env.SIWE_DOMAIN;
const origin = process.env.SIWE_ORIGIN;

export function createSiweMessage(address: string, statement: string) {
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: "1",
    chainId: 1,
  });
  return siweMessage.prepareMessage();
}
