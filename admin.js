/* ---------- Admin Panel: password, then the two options ---------- */
$("updateBtn").onclick = () => {
  $("pwInput").value = ""; $("pwError").textContent = "";
  $("pwModal").classList.remove("hidden"); $("pwInput").focus();
};
$("pwCancel").onclick = () => $("pwModal").classList.add("hidden");
$("pwInput").addEventListener("keydown", e => { if (e.key === "Enter") $("pwOk").click(); });

$("pwOk").onclick = async () => {
  const pw = $("pwInput").value;
  const { data, error } = await db.rpc("check_admin_password", { p: pw });
  if (error || data !== true) { $("pwError").textContent = "Wrong password."; return; }
  adminPassword = pw;
  $("pwModal").classList.add("hidden");
  $("adminModal").classList.remove("hidden");
};

$("adminClose").onclick = () => $("adminModal").classList.add("hidden");
$("goInfo").onclick = () => { $("adminModal").classList.add("hidden"); openForm(); };
$("goElo").onclick = () => { $("adminModal").classList.add("hidden"); openElo(); };
