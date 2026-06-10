document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('.login-form');
  AuthFormFeedback.bindClearOnInput(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    AuthFormFeedback.clear(form);

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username) {
      AuthFormFeedback.showFieldError(form, 'username', 'Enter your username.');
      return;
    }

    if (!password) {
      AuthFormFeedback.showFieldError(form, 'password', 'Enter your password.');
      return;
    }

    AuthFormFeedback.setLoading(form, true, 'Logging in…');

    try {
      const supabase = await MewApi.getSupabase();

      const { data: email, error: profileError } = await supabase.rpc(
        'get_email_for_username',
        { p_username: username }
      );

      if (profileError) {
        throw profileError;
      }

      if (!email) {
        AuthFormFeedback.showBanner(
          form,
          'error',
          'Invalid username or password. Please try again.'
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        AuthFormFeedback.showBanner(
          form,
          'error',
          'Invalid username or password. Please try again.'
        );
        return;
      }

      window.location.href = MewApi.consumeLoginReturnHref() || mewPath('/');
    } catch (err) {
      console.error('Login error:', err);
      AuthFormFeedback.showBanner(
        form,
        'error',
        'Something went wrong. Please try again in a moment.'
      );
    } finally {
      AuthFormFeedback.setLoading(form, false);
    }
  });
});
