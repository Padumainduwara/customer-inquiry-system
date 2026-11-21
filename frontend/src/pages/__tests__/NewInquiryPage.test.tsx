import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewInquiryPage from '../NewInquiryPage';
import * as api from '../../lib/api';

describe('NewInquiryPage - Form Validation & Error States', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Shows inline validation errors when submitting missing/invalid data', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(api, 'apiFetch');

    render(
      <MemoryRouter>
        <NewInquiryPage />
      </MemoryRouter>
    );

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    expect(await screen.findByText(/customer name must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email or phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/subject must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();

    // Ensure API was NOT called with invalid data
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('2. Displays API error banner when saving fails on the server', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'apiFetch').mockRejectedValueOnce(
      new api.ApiError('Database connection lost', 500)
    );

    render(
      <MemoryRouter>
        <NewInquiryPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/customer name/i), 'Amal Jayasinghe');
    await user.type(screen.getByLabelText(/contact/i), 'amal@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Catering request');
    await user.type(
      screen.getByLabelText(/description/i),
      'Need coffee and pastries for 40 people next Monday.'
    );

    await user.click(screen.getByRole('button', { name: /save inquiry/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Database connection lost');
  });
});