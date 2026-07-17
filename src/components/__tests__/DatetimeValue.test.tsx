import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DatetimeValue, prettyDatetime } from '../DatetimeValue';

describe('prettyDatetime', () => {
  it('prettifies a KERI stamp with microseconds and a colon-less offset (UTC)', () => {
    // weekday is asserted only by shape, so the test can't drift on a calendar lookup
    expect(prettyDatetime('2026-07-25T19:03:27.123948+0000')).toMatch(/^[A-Z][a-z]{2}, 25 July 19:03 UTC$/);
  });

  it('handles a colon offset and microseconds', () => {
    expect(prettyDatetime('2020-08-22T17:50:09.988921+00:00')).toMatch(/^[A-Z][a-z]{2}, 22 August 17:50 UTC$/);
  });

  it('anchors to UTC, converting a non-zero offset', () => {
    // 21:00 at +02:00 is 19:00 UTC
    expect(prettyDatetime('2020-08-22T21:00:00+02:00')).toMatch(/, 22 August 19:00 UTC$/);
  });

  it('returns null for something that is not a date', () => {
    expect(prettyDatetime('not-a-date')).toBeNull();
  });
});

describe('DatetimeValue', () => {
  it('shows the raw stamp, then the prettified reading in parens', () => {
    const { container } = render(<DatetimeValue value="2020-08-22T17:50:09.988921+00:00" />);
    expect(container.querySelector('.dt-raw')).toHaveTextContent('2020-08-22T17:50:09.988921+00:00');
    expect(container.querySelector('.dt-pretty')).toHaveTextContent(/\(.*22 August 17:50 UTC\)/);
  });

  it('falls back to the raw text alone when it does not parse', () => {
    const { container } = render(<DatetimeValue value="whenever" />);
    expect(screen.getByText('whenever')).toBeInTheDocument();
    expect(container.querySelector('.cesr-dt')).toBeNull();
  });
});
