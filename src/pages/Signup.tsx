import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword, validateRequired } from '@/utils/validation';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

/**
 * Signup page component
 */
export function Signup() {
  const navigate = useNavigate();
  const { signup, confirmSignUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    verificationCode?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!validateRequired(name)) {
      newErrors.name = 'Name is required';
    }

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password =
        'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (needsVerification) {
      // Verify email code
      if (!verificationCode.trim()) {
        setErrors({ verificationCode: 'Verification code is required' });
        return;
      }

      setIsLoading(true);
      try {
        await confirmSignUp(email, verificationCode);
        // Verification successful
        showSuccess('Email verified successfully! You can now login.');
        // Navigate to login page after a short delay to show success message
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } catch (error) {
        handleApiError(error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Signup
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password, name);
      // Show verification code input
      setNeedsVerification(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animated-bg">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="gradient-text">
              {needsVerification ? 'Verify Your Email' : 'Create Account'}
            </span>
          </h1>
          <p className="text-slate-600 text-lg">
            {needsVerification
              ? 'Enter the verification code sent to your email'
              : 'Join us to discover your next favorite book'}
          </p>
        </div>

        <div className="glass-effect rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit}>
            {needsVerification ? (
              <>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    We've sent a verification code to <strong>{email}</strong>. Please check your
                    email and enter the code below.
                  </p>
                </div>

                <Input
                  label="Verification Code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setErrors({});
                  }}
                  error={errors.verificationCode}
                  required
                  placeholder="123456"
                  maxLength={6}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNeedsVerification(false);
                      setVerificationCode('');
                      setErrors({});
                    }}
                    className="text-sm text-violet-600 hover:text-violet-700 font-semibold"
                  >
                    Back to signup
                  </button>
                </div>
              </>
            ) : (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  required
                  placeholder="John Doe"
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                  placeholder="you@example.com"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  required
                  placeholder="••••••••"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  required
                  placeholder="••••••••"
                />

                <div className="mb-6">
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 mr-2 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      required
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">
                      I agree to the{' '}
                      <Link
                        to="/terms"
                        className="text-violet-600 hover:text-violet-700 font-semibold"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        className="text-violet-600 hover:text-violet-700 font-semibold"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
