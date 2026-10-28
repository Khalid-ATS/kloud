<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Player List</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Player List</h1>
    <div class="toolbar">
      <input id="search" type="text" placeholder="Search by name, username or ID...">
      <button id="updateBtn" class="btn">Update Info</button>
    </div>
  </header>

  <main id="list"></main>

  <!-- Profile popup (opens from View Profile) -->
  <div id="profileModal" class="overlay hidden">
    <div class="modal">
      <div id="profileBody"></div>
      <div class="actions">
        <button id="profileClose" class="btn secondary">Close</button>
      </div>
    </div>
  </div>

  <!-- Password popup -->
  <div id="pwModal" class="overlay hidden">
    <div class="modal small">
      <h2>Enter Password</h2>
      <input id="pwInput" type="password" placeholder="Password">
      <p id="pwError" class="error"></p>
      <div class="actions">
        <button id="pwCancel" class="btn secondary">Cancel</button>
        <button id="pwOk" class="btn">Continue</button>
      </div>
    </div>
  </div>

  <!-- Info popup -->
  <div id="infoModal" class="overlay hidden">
    <div class="modal">
      <h2>Update Player</h2>
      <div id="formFields"></div>
      <p id="formNote" class="note"></p>
      <p id="formError" class="error"></p>
      <div class="actions">
        <button id="infoCancel" class="btn secondary">Cancel</button>
        <button id="saveBtn" class="btn" disabled>Save</button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
  <!-- Order matters: each file can only use things from the files above it.
       When you edit a file, change its ?v= number so browsers load the new copy. -->
  <script src="config.js?v=1"></script>
  <script src="badges.js?v=1"></script>
  <script src="ranks.js?v=1"></script>
  <script src="stats.js?v=1"></script>
  <script src="profile.js?v=1"></script>
  <script src="admin.js?v=1"></script>
  <script src="main.js?v=1"></script>
</body>
</html>
