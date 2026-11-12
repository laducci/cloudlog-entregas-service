import { randomUUID } from "node:crypto";
import { Clock, IdGenerator } from "../../Domain/Ports";

export class SystemClock implements Clock { now() { return new Date(); } }
export class UuidGenerator implements IdGenerator { next() { return randomUUID(); } }
