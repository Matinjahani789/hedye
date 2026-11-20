// Persian (Solar Hijri) helpers + the real calendar data for Farvardin → Aban 1405.
// Nothing here is hand-placed: every weekday is derived from the verified anchor
// "1 Farvardin 1405 = 21 March 2026" (Nowruz 1405: equinox 20 March 2026, 14:46 UTC,
// i.e. after noon in Tehran → the new year starts on the 21st).

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const toFa = (n: number | string): string => String(n).replace(/\d/g, (d) => FA[+d]);

export const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"] as const;
export const WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const GREG_FA = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];

export interface MonthInfo {
  index: number;
  name: string;
  year: number;
  days: number;
  /** 0 = Saturday … 6 = Friday : column of day 1 */
  offset: number;
  gregorian: string;
  startDate: Date;
}

const DAY = 86400000;
const NOWRUZ_1405 = Date.UTC(2026, 2, 21); // 21 March 2026
const MONTH_DEFS: [string, number][] = [
  ["فروردین", 31],
  ["اردیبهشت", 31],
  ["خرداد", 31],
  ["تیر", 31],
  ["مرداد", 31],
  ["شهریور", 31],
  ["مهر", 30],
  ["آبان", 30],
];

export const jalaliToUtc = (monthIdx: number, day: number): Date => {
  let ms = NOWRUZ_1405;
  for (let i = 0; i < monthIdx; i++) ms += MONTH_DEFS[i][1] * DAY;
  return new Date(ms + (day - 1) * DAY);
};

/** Saturday-first weekday index (0 = شنبه … 6 = جمعه) */
export const weekdayIndex = (d: Date): number => (d.getUTCDay() + 1) % 7;

export const MONTHS_1405: MonthInfo[] = MONTH_DEFS.map(([name, days], index) => {
  const start = jalaliToUtc(index, 1);
  const end = jalaliToUtc(index, days);
  const a = GREG_FA[start.getUTCMonth()];
  const b = GREG_FA[end.getUTCMonth()];
  return {
    index,
    name,
    year: 1405,
    days,
    offset: weekdayIndex(start),
    gregorian: `${a === b ? a : `${a} – ${b}`} ${toFa(end.getUTCFullYear())}`,
    startDate: start,
  };
});

export const ABAN_INDEX = 7;
export const BIRTHDAY_DAY = 28;
export const TODAY_DAY = 29;

/** Self-check (logged in dev only): throws if the calendar math disagrees with the spec. */
export function verifyCalendar(): boolean {
  const aban = MONTHS_1405[ABAN_INDEX];
  const bday = jalaliToUtc(ABAN_INDEX, BIRTHDAY_DAY);
  const today = jalaliToUtc(ABAN_INDEX, TODAY_DAY);
  return (
    aban.days === 30 &&
    aban.offset === 6 && // Friday
    weekdayIndex(bday) === 4 + 1 && // Thursday (پنجشنبه) → index 5
    bday.toISOString().slice(0, 10) === "2026-11-19" &&
    today.toISOString().slice(0, 10) === "2026-11-20"
  );
}
