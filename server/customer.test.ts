import { describe, expect, it } from "vitest";
import { isValidBirthDate, isValidCpf } from "../shared/customer";

describe("customer checkout validation", () => {
  it("accepts a valid CPF and rejects repeated digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("accepts an adult birth date and rejects a future date", () => {
    expect(isValidBirthDate("1990-05-20")).toBe(true);
    expect(isValidBirthDate("2990-05-20")).toBe(false);
  });
});
