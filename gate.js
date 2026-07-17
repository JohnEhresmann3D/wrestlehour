(() => {
  const PASSWORD = 'BayBay';
  const SESSION_KEY = 'wh-gate-unlocked';

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    document.documentElement.classList.remove('gate-locked');
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.createElement('div');
    overlay.id = 'gate-overlay';
    overlay.innerHTML = `
      <form class="gate-form">
        <p class="gate-title">WRESTLEHOUR</p>
        <p class="gate-sub">Site under construction. Enter password to continue.</p>
        <input type="password" class="gate-input" autocomplete="off" autofocus>
        <button type="submit" class="gate-submit">ENTER</button>
        <p class="gate-error" hidden>Incorrect password.</p>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('.gate-form');
    const input = overlay.querySelector('.gate-input');
    const error = overlay.querySelector('.gate-error');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (input.value === PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, '1');
        document.documentElement.classList.remove('gate-locked');
        overlay.remove();
      } else {
        error.hidden = false;
        input.value = '';
        input.focus();
      }
    });
  });
})();
