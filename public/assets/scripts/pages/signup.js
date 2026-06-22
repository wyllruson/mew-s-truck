function mapSignupErrorMessage(error) {
  const message = (error?.message || '').toLowerCase();

  if (message.includes('already registered') || message.includes('already been registered')) {
    return { field: 'email', text: 'An account with this email already exists.' };
  }
  if (message.includes('password')) {
    return { field: 'password', text: 'Choose a stronger password (at least 8 characters).' };
  }
  if (message.includes('valid email') || message.includes('invalid email')) {
    return { field: 'email', text: 'Enter a valid email address.' };
  }

  return {
    field: null,
    text: error?.message || 'Something went wrong. Please try again.',
  };
}

function isAuthPagePath(path) {
  const loginPath = mewPath('/account/login/').replace(/\/$/, '');
  const signupPath = mewPath('/account/signup/').replace(/\/$/, '');
  const cartPath = mewPath('/cart/').replace(/\/$/, '');
  const normalized = path.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return normalized === loginPath || normalized === signupPath || normalized === cartPath;
}

function getSignupRedirectTarget() {
  const returnHref = MewApi.consumeLoginReturnHref();
  
  // If there's a return href and it's not an auth page, use it
  if (returnHref && !isAuthPagePath(returnHref)) {
    return returnHref;
  }
  
  // Otherwise redirect to home
  return mewPath('/');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.signup-form');
  AuthFormFeedback.bindClearOnInput(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    AuthFormFeedback.clear(form);

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    let hasFieldError = false;

    if (username.length < 2 || username.length > 32) {
      AuthFormFeedback.showFieldError(form, 'username', 'Username must be 2–32 characters.');
      hasFieldError = true;
    }

    if (!email) {
      AuthFormFeedback.showFieldError(form, 'email', 'Enter your email address.');
      hasFieldError = true;
    }

    if (password.length < 8) {
      AuthFormFeedback.showFieldError(form, 'password', 'Password must be at least 8 characters.');
      hasFieldError = true;
    }

    if (password !== confirmPassword) {
      AuthFormFeedback.showFieldError(form, 'confirm-password', 'Passwords do not match.');
      hasFieldError = true;
    }

    if (hasFieldError) {
      return;
    }

    AuthFormFeedback.setLoading(form, true, 'Creating account…');
    let succeeded = false;

    try {
      const supabase = await MewApi.getSupabase();

      const { data: taken, error: takenError } = await supabase.rpc('is_username_taken', {
        p_username: username,
      });

      if (takenError) {
        throw takenError;
      }

      if (taken) {
        AuthFormFeedback.showFieldError(
          form,
          'username',
          'This username is already taken. Try another.'
        );
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        const mapped = mapSignupErrorMessage(error);
        if (mapped.field) {
          AuthFormFeedback.showFieldError(form, mapped.field, mapped.text);
        } else {
          AuthFormFeedback.showBanner(form, 'error', mapped.text);
        }
        return;
      }

      // Sign up succeeded, now sign in the user immediately
      AuthFormFeedback.showBanner(
        form,
        'success',
        'Account created! Logging you in…'
      );

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        succeeded = true;
        
        // Get the redirect target (previous page if not auth page, otherwise home)
        const redirectTarget = getSignupRedirectTarget();
        window.location.href = redirectTarget;
      } catch (signInErr) {
        console.error('Sign in after signup error:', signInErr);
        AuthFormFeedback.showBanner(
          form,
          'error',
          'Account created but login failed. Please log in manually.'
        );
        window.setTimeout(() => {
          window.location.href = mewPath('/account/login/');
        }, 2000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      AuthFormFeedback.showBanner(
        form,
        'error',
        'Something went wrong. Please try again in a moment.'
      );
    } finally {
      if (!succeeded) {
        AuthFormFeedback.setLoading(form, false);
      }
    }
  });
});
