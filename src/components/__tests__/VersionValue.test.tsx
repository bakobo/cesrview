import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VersionValue, parseVersion } from '../VersionValue';

describe('parseVersion', () => {
  it('parses a v1 KERI/JSON version string into its fields', () => {
    expect(parseVersion('KERI10JSON00037f_')).toEqual({ proto: 'KERI', version: '1.0', kind: 'JSON', size: 895 });
  });

  it('reads the size as hex and the version nibbles as decimal', () => {
    expect(parseVersion('KERI10JSON00049d_')).toEqual({ proto: 'KERI', version: '1.0', kind: 'JSON', size: 1181 });
    expect(parseVersion('ACDC20CBOR000123_')).toEqual({ proto: 'ACDC', version: '2.0', kind: 'CBOR', size: 291 });
  });

  it('returns null for anything that is not a v1 version string', () => {
    expect(parseVersion('not a version')).toBeNull();
    expect(parseVersion('KERI10JSON00037f')).toBeNull(); // missing terminator
    expect(parseVersion('')).toBeNull();
  });
});

describe('VersionValue', () => {
  it('shows the raw token, then a prettified decode in parens', () => {
    const { container } = render(<VersionValue value="KERI10JSON00037f_" />);
    expect(container.querySelector('.vraw')).toHaveTextContent('KERI10JSON00037f_'); // exact bytes kept
    expect(container.querySelector('.vpretty')).toHaveTextContent('(KERI 1.0, JSON, 895 bytes)');
  });

  it('falls back to the raw text alone when it is not a recognizable version string', () => {
    const { container } = render(<VersionValue value="mystery-value" />);
    expect(screen.getByText('mystery-value')).toBeInTheDocument();
    expect(container.querySelector('.cesr-version')).toBeNull();
  });
});
