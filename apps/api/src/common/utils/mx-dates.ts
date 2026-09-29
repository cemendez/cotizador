const MX_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const mxWallClock = (now: Date) => new Date(now.getTime() - MX_OFFSET_MS);

export function currentMonthRangeMx(now = new Date()) {
    const local = mxWallClock(now);
    const year = local.getUTCFullYear();
    const month = local.getUTCMonth();
    return {
        start: new Date(Date.UTC(year, month, 1) + MX_OFFSET_MS),
        end: new Date(Date.UTC(year, month + 1, 1) + MX_OFFSET_MS),
    };
}

export function todayMxAsDateOnly(now = new Date()) {
    const local = mxWallClock(now);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);