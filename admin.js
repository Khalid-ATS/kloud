/* ---------- Admin Panel: password, then the two options ---------- */
$("updateBtn").onclick = () => {
  $("pwInput").value = ""; $("pwError").textContent = "";
  $("pwModal").classList.remove("hidden"); $("pwInput").focus();
};
$("pwCancel").onclick = () => $("pwModal").classList.add("hidden");
$("pwInput").addEventListener("keydown", e => { if (e.key === "Enter") $("pwOk").click(); });

// True when the request failed because of the connection (offline, server unreachable ...)
const isNetworkError = (err) =>
  !navigator.onLine ||
  /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test((err && err.message) || "");

$("pwOk").onclick = async () => {
  const pw = $("pwInput").value;
  const { data, error } = await db.rpc("check_admin_password", { p: pw });

  if (error) {
    console.error(error);
    $("pwError").textContent = isNetworkError(error)
      ? "Network error. Check your connection and try again."
      : "Could not check the password: " + error.message;
    return;
  }
  if (data !== true) { $("pwError").textContent = "Wrong password."; return; }

  adminPassword = pw;
  $("pwModal").classList.add("hidden");
  $("adminModal").classList.remove("hidden");
};

$("adminClose").onclick = () => $("adminModal").classList.add("hidden");
$("goInfo").onclick = () => { $("adminModal").classList.add("hidden"); openForm(); };
$("goElo").onclick = () => { $("adminModal").classList.add("hidden"); openElo(); };
