import { isRetryableError } from '@/lib/retryableError';

describe('isRetryableError', () => {
  it('retries timeouts and server errors', () => {
    expect(isRetryableError({ status: 408, message: 'timeout' })).toBe(true);
    expect(isRetryableError({ status: 503, message: 'server' })).toBe(true);
    expect(isRetryableError(new TypeError('Network request failed'))).toBe(true);
  });

  it('does not retry validation errors', () => {
    expect(isRetryableError({ status: 400, message: 'bad request' })).toBe(false);
    expect(isRetryableError({ status: 401, message: 'unauthorized' })).toBe(false);
  });
});
