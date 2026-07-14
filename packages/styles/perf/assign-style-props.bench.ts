import { assignStyleProps } from "../src/assign";

class Target {
  assignments = 0;
  private _paddingLeft = 0;
  private _paddingRight = 0;

  get paddingLeft(): number {
    return this._paddingLeft;
  }

  set paddingLeft(value: number) {
    this._paddingLeft = value;
    this.assignments++;
  }

  get paddingRight(): number {
    return this._paddingRight;
  }

  set paddingRight(value: number) {
    this._paddingRight = value;
    this.assignments++;
  }
}

const target = new Target();
const iterations = 100_000;
const start = performance.now();

for (let index = 0; index < iterations; index++) {
  const paddingX = index % 2;
  assignStyleProps(target, { paddingX });
  assignStyleProps(target, { paddingX });
}

const duration = performance.now() - start;
const expectedAssignments = iterations * 2;
if (target.assignments !== expectedAssignments) {
  throw new Error(
    `Expected ${expectedAssignments} assignments, received ${target.assignments}`,
  );
}

console.log(
  JSON.stringify({
    assignments: target.assignments,
    iterations,
    milliseconds: Math.round(duration * 100) / 100,
  }),
);
