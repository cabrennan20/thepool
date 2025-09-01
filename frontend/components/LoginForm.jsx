import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [venmoPaypalHandle, setVenmoPaypalHandle] = useState('');
  const [registerError, setRegisterError] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState(null);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const { login, isLoading, error } = useAuth();

  // Validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  // Validation functions matching backend schema
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'username':
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 50) return 'Username must be 50 characters or less';
        if (!/^[a-zA-Z0-9_\s]+$/.test(value)) return 'Username can only contain letters, numbers, spaces, and underscores';
        return null;
      
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        if (value.length > 100) return 'Email must be 100 characters or less';
        return null;
      
      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 100) return 'Password must be 100 characters or less';
        return null;
      
      case 'firstName':
        if (value.length < 1) return 'First name is required';
        if (value.length > 50) return 'First name must be 50 characters or less';
        return null;
      
      case 'lastName':
        if (value.length < 1) return 'Last name is required';
        if (value.length > 50) return 'Last name must be 50 characters or less';
        return null;
      
      case 'alias':
        if (value.length < 2) return 'Alias must be at least 2 characters';
        if (value.length > 50) return 'Alias must be 50 characters or less';
        if (!/^[a-zA-Z0-9\s&'-]+$/.test(value)) return 'Alias can only contain letters, numbers, spaces, and common symbols (&, \', -)';
        return null;
      
      case 'phone':
        if (value.length < 10) return 'Phone number must be at least 10 characters';
        if (value.length > 20) return 'Phone number must be 20 characters or less';
        if (!/^[\d\s\-+().\s]+$/.test(value)) return 'Phone number can only contain digits, spaces, and common symbols';
        return null;
      
      case 'venmoPaypalHandle':
        if (value.length < 1) return 'Venmo/PayPal handle is required';
        if (value.length > 100) return 'Handle must be 100 characters or less';
        if (!/^(@?[a-zA-Z0-9_-]+|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(value)) return 'Handle must be a valid username or email format';
        return null;
      
      default:
        return null;
    }
  };

  const handleFieldBlur = (fieldName, value) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const getFieldClasses = (fieldName) => {
    const baseClasses = "w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200";
    const hasError = fieldTouched[fieldName] && fieldErrors[fieldName];
    const isValid = fieldTouched[fieldName] && !fieldErrors[fieldName];
    
    if (hasError) {
      return `${baseClasses} bg-red-50 border-red-300 focus:ring-red-500 focus:border-red-500`;
    } else if (isValid) {
      return `${baseClasses} bg-green-50 border-green-300 focus:ring-green-500 focus:border-green-500`;
    } else {
      return `${baseClasses} bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-transparent`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isForgotPassword) {
      await handleForgotPassword();
    } else if (isLogin) {
      await login(username, password);
    } else {
      await handleRegister();
    }
  };

  const handleForgotPassword = async () => {
    try {
      setForgotPasswordError(null);
      setForgotPasswordLoading(true);
      
      const response = await api.forgotPassword(email);
      setForgotPasswordSuccess(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegisterError(null);
      setRegisterLoading(true);
      
      const response = await api.register({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        alias,
        phone,
        venmo_paypal_handle: venmoPaypalHandle
      });
      
      // Auto-login after successful registration
      await login(username, password);
      
    } catch (error) {
      if (error.details && Array.isArray(error.details)) {
        // Show detailed validation errors
        const detailedErrors = error.details.map(detail => 
          `${detail.path.join('.')}: ${detail.message}`
        ).join('\n');
        setRegisterError(detailedErrors);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setRegisterError(errorMessage);
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">🏈</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isForgotPassword ? 'Enter your email to reset password' : isLogin ? 'Sign in to ThePool' : 'Join ThePool today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isForgotPassword ? (
              <>
                {forgotPasswordSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm text-center">
                      <p className="font-semibold mb-2">📧 Email Sent!</p>
                      <p>If that email address is in our system, we've sent a password reset link. Check your email and click the link to reset your password.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}
              </>
            ) : !isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      className={getFieldClasses('firstName')}
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                    />
                    {fieldTouched.firstName && fieldErrors.firstName && (
                      <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      className={getFieldClasses('lastName')}
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                    />
                    {fieldTouched.lastName && fieldErrors.lastName && (
                      <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <input
                    type="email"
                    required
                    className={getFieldClasses('email')}
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  />
                  {fieldTouched.email && fieldErrors.email && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className={getFieldClasses('alias')}
                    placeholder="Member Alias (how you'll appear to others)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    onBlur={(e) => handleFieldBlur('alias', e.target.value)}
                  />
                  {fieldTouched.alias && fieldErrors.alias && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.alias}</p>
                  )}
                  {(!fieldTouched.alias || !fieldErrors.alias) && (
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      This is your display name in the league (e.g., "Team Ram Rod", "Clammy Twatkins")
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    className={getFieldClasses('phone')}
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                  />
                  {fieldTouched.phone && fieldErrors.phone && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className={getFieldClasses('venmoPaypalHandle')}
                    placeholder="Venmo/PayPal Handle (e.g., @username)"
                    value={venmoPaypalHandle}
                    onChange={(e) => setVenmoPaypalHandle(e.target.value)}
                    onBlur={(e) => handleFieldBlur('venmoPaypalHandle', e.target.value)}
                  />
                  {fieldTouched.venmoPaypalHandle && fieldErrors.venmoPaypalHandle && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.venmoPaypalHandle}</p>
                  )}
                  {(!fieldTouched.venmoPaypalHandle || !fieldErrors.venmoPaypalHandle) && (
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      Your Venmo or PayPal username for league payments
                    </p>
                  )}
                </div>
              </>
            )}
            
            {(isLogin || (!isLogin && !isForgotPassword)) && (
              <>
                <div>
                  <input
                    type="text"
                    required
                    className={isLogin ? "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" : getFieldClasses('username')}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={!isLogin ? (e) => handleFieldBlur('username', e.target.value) : undefined}
                  />
                  {!isLogin && fieldTouched.username && fieldErrors.username && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    required
                    className={isLogin ? "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" : getFieldClasses('password')}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={!isLogin ? (e) => handleFieldBlur('password', e.target.value) : undefined}
                  />
                  {!isLogin && fieldTouched.password && fieldErrors.password && (
                    <p className="text-red-600 text-xs mt-1 px-1">{fieldErrors.password}</p>
                  )}
                </div>
              </>
            )}

            {/* Error Messages */}
            {(error || registerError || forgotPasswordError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-600 text-sm text-center whitespace-pre-line">{error || registerError || forgotPasswordError}</div>
              </div>
            )}

            {/* Submit Button */}
            {!forgotPasswordSuccess && (
              <button
                type="submit"
                disabled={isLoading || registerLoading || forgotPasswordLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg"
              >
                {isLoading || registerLoading || forgotPasswordLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isForgotPassword ? 'Sending reset email...' : isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  isForgotPassword ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            )}
          </form>

          {/* Toggle Login/Register/Forgot Password */}
          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setForgotPasswordSuccess(false);
                  setForgotPasswordError(null);
                }}
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
              >
                ← Back to <span className="text-blue-600 font-semibold">Sign In</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
                >
                  {isLogin ? 'Don\'t have an account? ' : 'Already have an account? '}
                  <span className="text-blue-600 font-semibold">
                    {isLogin ? 'Create one' : 'Sign in'}
                  </span>
                </button>
                
                {isLogin && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setIsLogin(false);
                      }}
                      className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
                    >
                      Forgot your password? <span className="text-blue-600 font-semibold">Reset it</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-xs">
            Secure login • ThePool
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;