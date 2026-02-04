/// <reference types="@hirosystems/clarinet-sdk/vitest" />

import type { Assertion, AsymmetricMatchersContaining } from "vitest";

interface ClarityMatchers<R = unknown> {
  toBeOk(expected?: any): R;
  toBeErr(expected?: any): R;
  toBeSome(expected?: any): R;
  toBeNone(): R;
  toBeBool(expected: boolean): R;
  toBeUint(expected: number | bigint): R;
  toBeInt(expected: number | bigint): R;
  toBePrincipal(expected: string): R;
  toBeAscii(expected: string): R;
  toBeUtf8(expected: string): R;
  toBeBuff(expected: Uint8Array): R;
  toBeList(expected: any[]): R;
  toBeTuple(expected: Record<string, any>): R;
}

declare global {
  const simnet: import("@hirosystems/clarinet-sdk").Simnet;
}

declare module "vitest" {
  interface Assertion<T = any> extends ClarityMatchers<void> {}
  interface AsymmetricMatchersContaining extends ClarityMatchers<any> {}
}
