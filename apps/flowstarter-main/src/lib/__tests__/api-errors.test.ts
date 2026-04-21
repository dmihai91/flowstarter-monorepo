import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { apiError } from '../api-errors';

describe('apiError', () => {
  it.each([
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['VALIDATION_ERROR', 422],
    ['INTERNAL_ERROR', 500],
    ['BAD_GATEWAY', 502],
  ] as const)('returns status %i for code %s', (code, expectedStatus) => {
    const response = apiError('test message', code);
    expect(response.status).toBe(expectedStatus);
  });

  it('includes error message and code in the JSON body', async () => {
    const response = apiError('Something went wrong', 'INTERNAL_ERROR');
    const body = await response.json();

    expect(body.error).toBe('Something went wrong');
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('omits details when not provided', async () => {
    const response = apiError('Not found', 'NOT_FOUND');
    const body = await response.json();

    expect(body).not.toHaveProperty('details');
  });

  it('includes details when provided', async () => {
    const details = { field: 'email', issue: 'invalid format' };
    const response = apiError('Invalid input', 'VALIDATION_ERROR', details);
    const body = await response.json();

    expect(body.details).toEqual(details);
  });

  it('includes details even when details is null', async () => {
    const response = apiError('Error', 'BAD_REQUEST', null);
    const body = await response.json();

    expect(body.details).toBeNull();
  });

  it('returns a NextResponse instance', () => {
    const response = apiError('test', 'BAD_REQUEST');
    expect(response).toBeInstanceOf(NextResponse);
  });
});
