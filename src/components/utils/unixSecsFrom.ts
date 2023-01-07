export function unixSecsFrom(options: { minutesAgo: number; }) {
  return Math.round(0.001 * (Date.now() - options.minutesAgo * 60 * 1000));
}
