document.querySelectorAll('form[data-confirm]').forEach((f) =>
  f.addEventListener('submit', (e) => {
    if (!confirm(f.dataset.confirm)) e.preventDefault();
  })
);

/* Branch switcher: jump to the same page in another branch. */
(function () {
  var switcher = document.getElementById('branch-switch');
  if (!switcher) return;
  switcher.addEventListener('change', function () {
    var path = switcher.getAttribute('data-path') || '/dashboard';
    window.location.href = path.replace('__branch__', switcher.value);
  });
})();

/* Live preview for the image dropdown on the shared create/edit form. */
(function () {
  var select = document.getElementById('f-image');
  var preview = document.getElementById('image-preview');
  if (!select || !preview) return;

  function sync() {
    var value = select.value;
    if (!value) {
      preview.removeAttribute('src');
      preview.hidden = true;
      return;
    }
    preview.src =
      value.indexOf('/') === 0 || /^https?:\/\//.test(value)
        ? value
        : '/images/products/' + value;
    preview.hidden = false;
  }

  select.addEventListener('change', sync);
  sync();
})();
