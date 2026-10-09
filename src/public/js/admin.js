/* Add / update / delete dialogs for the module pages. */
(function () {
  var item = document.getElementById('item-dialog');
  if (!item) return;
  var del = document.getElementById('del-dialog');
  var form = item.querySelector('form'), heading = item.querySelector('h2'), base = form.dataset.base;
  var $ = function (id) { return document.getElementById(id); };

  document.querySelector('button[data-add]').addEventListener('click', function () {
    form.reset(); form.action = base; heading.textContent = form.dataset.addLabel;
    item.showModal(); $('f-name').focus();
  });
  document.querySelectorAll('[data-edit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.closest('tr').dataset;
      form.action = base + '/' + r.id + '/update'; heading.textContent = 'Update ' + r.name;
      $('f-name').value = r.name; $('f-price').value = r.price; $('f-status').value = r.status;
      item.showModal();
    });
  });
  document.querySelectorAll('[data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.closest('tr').dataset;
      del.querySelector('form').action = base + '/' + r.id + '/delete';
      $('del-msg').textContent = '\u201C' + r.name + '\u201D will be removed from the case.';
      del.showModal();
    });
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });
})();
