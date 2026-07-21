// Notifies connected admin sockets (joined to the "admin" room in index.cjs) that dashboard-
// relevant data changed, so the admin panel can refresh live instead of only on page load.
function emitAdminUpdate(io, entity) {
  if (!io) return;
  io.to("admin").emit("admin_update", { entity, at: Date.now() });
}

module.exports = { emitAdminUpdate };
