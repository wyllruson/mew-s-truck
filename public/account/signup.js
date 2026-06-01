document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.signup-form');
  document.getElementById('back-to-login')?.addEventListener('click', () => {
    window.location.href = mewPath('/account/login.html');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const supabase = await MewApi.getSupabase();

      const { data: taken, error: takenError } = await supabase.rpc('is_username_taken', {
        p_username: username,
      });

      if (takenError) {
        throw takenError;
      }

      if (taken) {
        alert('Username or email already exists');
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
        alert(error.message || 'An error occurred during signup');
        return;
      }

      alert('Account created successfully. You can log in now.');
      window.location.href = mewPath('/account/login.html');
    } catch (err) {
      console.error('Signup error:', err);
      alert('An error occurred during signup');
    }
  });
});
