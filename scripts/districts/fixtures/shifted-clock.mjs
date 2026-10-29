// Test preload (`node --import`): moves the wall clock forward by
// CLOCK_OFFSET_DAYS so a test can prove that a check does not depend on the
// date it runs on (TESTS-INFRA-1). Explicit dates are left untouched.
const offset = Number(process.env.CLOCK_OFFSET_DAYS ?? "0") * 86_400_000;
const RealDate = Date;

class ShiftedDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(RealDate.now() + offset);
    else super(...args);
  }

  static now() {
    return RealDate.now() + offset;
  }
}

globalThis.Date = ShiftedDate;
