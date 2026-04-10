const gameGrid = document.querySelector("#gameGrid");
const gameCount = document.querySelector("#gameCount");
const searchInput = document.querySelector("#searchInput");
const template = document.querySelector("#gameCardTemplate");

async function fetchGames(keyword = "") {
  const url = keyword ? `/api/games?search=${encodeURIComponent(keyword)}` : "/api/games";
  const response = await fetch(url);
  const games = await response.json();
  renderGames(games);
}

function renderGames(games) {
  gameGrid.innerHTML = "";
  gameCount.textContent = `共 ${games.length} 款游戏`;

  if (!games.length) {
    gameGrid.innerHTML = '<div class="empty-state">没有匹配的游戏资源</div>';
    return;
  }

  for (const game of games) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".card__image").src = game.cover_image;
    fragment.querySelector(".card__image").alt = game.name;
    fragment.querySelector(".card__title").textContent = game.name;
    fragment.querySelector(".card__summary").textContent = game.summary || "暂无简介";
    fragment.querySelector(".js-genre").textContent = game.genre || "未分类";
    fragment.querySelector(".js-platform").textContent = game.platform || "未知平台";
    const link = fragment.querySelector(".button");
    link.href = game.cloud_link;
    gameGrid.appendChild(fragment);
  }
}

let timer = null;
searchInput.addEventListener("input", (event) => {
  const keyword = event.target.value.trim();
  clearTimeout(timer);
  timer = setTimeout(() => fetchGames(keyword), 200);
});

fetchGames();
