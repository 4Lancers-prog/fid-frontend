import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';

// Hoisted mocks so they can be referenced inside vi.mock factories.
const { loginMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ login: loginMock, status: 'unauthenticated', hasRole: () => true, user: null }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

import { LoginPage } from '../../pages/auth/LoginPage';
import { I18nProvider } from '../../i18n';

function renderPage() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
  });

  it('shows field-level validation messages on empty submit', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your password.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials on valid submit', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);
    renderPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@farmerportal.local');
    await user.type(screen.getByLabelText(/password/i), 'Admin@12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(loginMock).toHaveBeenCalledWith('admin@farmerportal.local', 'Admin@12345');
  });

  it('surfaces the server error message when login fails', async () => {
    const user = userEvent.setup();
    const err = new AxiosError('bad');
    err.response = {
      status: 401,
      data: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password. Please check your details and try again.' } },
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    loginMock.mockRejectedValueOnce(err);
    renderPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@farmerportal.local');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
