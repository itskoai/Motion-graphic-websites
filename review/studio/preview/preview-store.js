/* Preview only (never uploaded with the site): keeps form submissions in the preview page's private storage.
   Each visitor's submissions live in one document readable only by them and the owner. */
(function () {
  var storeP = null;
  window.SITE_LEAD_STORE = function () {
    if (storeP) return storeP;
    storeP = (async function () {
      try {
        if (!window.claude || typeof window.claude.use !== 'function') return null;
        var both = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        var db = both[0], user = both[1];
        if (!db || !user) return null;
        var id = await user.id();
        if (!id) return null;
        var ref = db.doc('leads/' + id);
        var chain = Promise.resolve();
        return {
          save: function (kind, data) {
            var run = chain.then(async function () {
              var snap = await ref.get();
              var prev = snap.exists && Array.isArray((snap.data() || {}).entries) ? snap.data().entries : [];
              var entry = Object.assign({ kind: kind, at: new Date().toISOString() }, data);
              delete entry.website;
              await ref.set({ entries: prev.concat([entry]).slice(-200), updatedAt: entry.at });
              return { ok: true };
            });
            chain = run.catch(function () {});
            return run;
          }
        };
      } catch (e) { return null; }
    })();
    return storeP;
  };
  // the preview uses its own store, with the endpoint as the fallback
  if (window.SITE_CONFIG && window.SITE_CONFIG.forms) window.SITE_CONFIG.forms.mode = 'auto';
})();
