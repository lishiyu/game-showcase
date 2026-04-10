const loginPanel = document.querySelector("#loginPanel");
const adminApp = document.querySelector("#adminApp");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const currentUser = document.querySelector("#currentUser");
const form = document.querySelector("#gameForm");
const adminList = document.querySelector("#adminList");
const adminMessage = document.querySelector("#adminMessage");
const resetButton = document.querySelector("#resetButton");
const coverFileInput = document.querySelector("#coverFile");
const coverImageInput = document.querySelector("#coverImage");
const coverPreview = document.querySelector("#coverPreview");

function updateCoverPreview(src) {
  if (!src) {
    coverPreview.classList.add("hidden");
    coverPreview.removeAttribute("src");
    return;
  }

  coverPreview.src = src;
  coverPreview.classList.remove("hidden");
}

function showLoginView() {
  loginPanel.classList.remove("hidden");
  adminApp.classList.add("hidden");
}

function showAdminView(username) {
  currentUser.textContent = `当前登录：${username}`;
  loginPanel.classList.add("hidden");
  adminApp.classList.remove("hidden");
}

function formDataToPayload() {
  const payload = new FormData();
  payload.append("name", document.querySelector("#name").value);
  payload.append("coverImage", coverImageInput.value);
  payload.append("cloudLink", document.querySelector("#cloudLink").value);
  payload.append("genre", document.querySelector("#genre").value);
  payload.append("platform", document.querySelector("#platform").value);
  payload.append("summary", document.querySelector("#summary").value);
  payload.append("sortOrder", String(Number(document.querySelector("#sortOrder").value || 0)));

  if (coverFileInput.files[0]) {
    payload.append("coverFile", coverFileInput.files[0]);
  }

  return payload;
}

function setForm(game) {
  document.querySelector("#gameId").value = game?.id || "";
  document.querySelector("#name").value = game?.name || "";
  coverImageInput.value = game?.cover_image || "";
  document.querySelector("#cloudLink").value = game?.cloud_link || "";
  document.querySelector("#genre").value = game?.genre || "";
  document.querySelector("#platform").value = game?.platform || "";
  document.querySelector("#summary").value = game?.summary || "";
  document.querySelector("#sortOrder").value = game?.sort_order || 0;
  coverFileInput.value = "";
  updateCoverPreview(game?.cover_image || "");
}

async function loadGames() {
  const response = await fetch("/api/games");
  const games = await response.json();
  renderAdminList(games);
  adminMessage.textContent = `共 ${games.length} 条记录`;
}

async function checkAuth() {
  const response = await fetch("/api/admin/me");

  if (!response.ok) {
    showLoginView();
    return false;
  }

  const result = await response.json();
  showAdminView(result.username);
  await loadGames();
  return true;
}

async function handleUnauthorized(response) {
  if (response.status !== 401) {
    return false;
  }

  showLoginView();
  loginMessage.textContent = "登录已失效，请重新登录";
  return true;
}

function renderAdminList(games) {
  adminList.innerHTML = "";

  if (!games.length) {
    adminList.innerHTML = '<div class="empty-state">还没有游戏数据，请先在左侧新增</div>';
    return;
  }

  for (const game of games) {
    const item = document.createElement("article");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="section-head">
        <h3>${game.name}</h3>
        <span class="tag">${game.genre || "未分类"}</span>
      </div>
      <p>${game.summary || "暂无简介"}</p>
      <p>平台：${game.platform || "未知"} | 排序：${game.sort_order}</p>
      <div class="admin-item__actions">
        <a class="button button--ghost" href="${game.cloud_link}" target="_blank" rel="noreferrer">查看网盘</a>
        <button class="button button--ghost" data-action="edit" data-id="${game.id}">编辑</button>
        <button class="button" data-action="delete" data-id="${game.id}">删除</button>
      </div>
    `;
    adminList.appendChild(item);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: document.querySelector("#loginUsername").value,
      password: document.querySelector("#loginPassword").value
    })
  });

  const result = await response.json();

  if (!response.ok) {
    loginMessage.textContent = result.message || "登录失败";
    return;
  }

  document.querySelector("#loginPassword").value = "";
  showAdminView(result.username);
  await loadGames();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const gameId = document.querySelector("#gameId").value;
  const method = gameId ? "PUT" : "POST";
  const url = gameId ? `/api/games/${gameId}` : "/api/games";

  const response = await fetch(url, {
    method,
    body: formDataToPayload()
  });

  const result = await response.json();

  if (!response.ok) {
    if (await handleUnauthorized(response)) {
      return;
    }
    alert(result.message || result.error || "保存失败");
    return;
  }

  setForm(null);
  await loadGames();
});

adminList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "edit") {
    const response = await fetch(`/api/games/${id}`);
    const game = await response.json();
    setForm(game);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("确认删除这条游戏记录？");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/games/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      if (await handleUnauthorized(response)) {
        return;
      }
      alert(result.message || "删除失败");
      return;
    }

    await loadGames();
  }
});

resetButton.addEventListener("click", () => setForm(null));

coverImageInput.addEventListener("input", (event) => {
  updateCoverPreview(event.target.value.trim());
});

coverFileInput.addEventListener("change", () => {
  const file = coverFileInput.files[0];
  if (!file) {
    updateCoverPreview(coverImageInput.value.trim());
    return;
  }

  updateCoverPreview(URL.createObjectURL(file));
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  showLoginView();
  setForm(null);
  adminList.innerHTML = "";
  adminMessage.textContent = "";
});

checkAuth();
