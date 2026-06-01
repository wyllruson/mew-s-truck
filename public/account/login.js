document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('.login-form');
  document.getElementById('go-to-signup')?.addEventListener('click', () => {
    window.location.href = mewPath('/account/signup.html');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

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
        alert('Invalid username or password');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Invalid username or password');
        return;
      }

      window.location.href = mewPath('/index.html');
    } catch (err) {
      console.error('Login error:', err);
      alert('An error occurred during login');
    }
  });
});
