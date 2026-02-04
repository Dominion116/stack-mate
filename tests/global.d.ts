/// <reference types="@hirosystems/clarinet-sdk/vitest" />
/// <reference types="vitest" />

declare global {
  const simnet: import("@hirosystems/clarinet-sdk").SimnetProvider;
  
  namespace Vi {
    interface Assertion {
      toBeOk(expected?: any): void;
      toBeErr(expected?: any): void;
      toBeSome(expected?: any): void;
      toBeNone(): void;
      toBeBool(expected: boolean): void;
      toBeUint(expected: number | bigint): void;
      toBeInt(expected: number | bigint): void;
      toBePrincipal(expected: string): void;
      toBeAscii(expected: string): void;
      toBeUtf8(expected: string): void;
      toBeBuff(expected: Uint8Array): void;
      toBeList(expected: any[]): void;
      toBeTuple(expected: Record<string, any>): void;
    }
    
    interface AsymmetricMatchersContaining {
      toBeOk(expected?: any): any;
      toBeErr(expected?: any): any;
      toBeSome(expected?: any): any;
      toBeNone(): any;
      toBeBool(expected: boolean): any;
      toBeUint(expected: number | bigint): any;
      toBeInt(expected: number | bigint): any;
      toBePrincipal(expected: string): any;
      toBeAscii(expected: string): any;
      toBeUtf8(expected: string): any;
      toBeBuff(expected: Uint8Array): any;
      toBeList(expected: any[]): any;
      toBeTuple(expected: Record<string, any>): any;
    }
  }
}

export {};
