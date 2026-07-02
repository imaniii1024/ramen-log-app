const STORAGE_KEY = "ramen-log.entries";

const form = document.querySelector("#ramenForm");
const editingId = document.querySelector("#editingId");
const formTitle = document.querySelector("#formTitle");
const dateInput = document.querySelector("#dateInput");
const shopInput = document.querySelector("#shopInput");
const ramenInput = document.querySelector("#ramenInput");
const typeInput = document.querySelector("#typeInput");
const priceInput = document.querySelector("#priceInput");
const ratingInput = document.querySelector("#ratingInput");
const ratingOutput = document.querySelector("#ratingOutput");
const memoInput = document.querySelector("#memoInput");
const todayButton = document.querySelector("#todayButton");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const shareJumpButton = document.querySelector("#shareJumpButton");
const searchInput = document.querySelector("#searchInput");
const exportButton = document.querySelector("#exportButton");
const historyList = document.querySelector("#historyList");
const template = document.querySelector("#historyItemTemplate");
const filterButtons = document.querySelectorAll("[data-filter]");
const periodButtons = document.querySelectorAll("[data-period-mode]");
const rankingButtons = document.querySelectorAll("[data-ranking]");
const periodSelect = document.querySelector("#periodSelect");
const periodList = document.querySelector("#periodList");
const rankingList = document.querySelector("#rankingList");

const labels = {
  totalCount: document.querySelector("#totalCount"),
  monthCount: document.querySelector("#monthCount"),
  monthLabel: document.querySelector("#monthLabel"),
  averageRating: document.querySelector("#averageRating"),
  favoriteShop: document.querySelector("#favoriteShop"),
  favoriteShopCount: document.querySelector("#favoriteShopCount"),
  shareDate: document.querySelector("#shareDate"),
  shareRamen: document.querySelector("#shareRamen"),
  shareShop: document.querySelector("#shareShop"),
  shareType: document.querySelector("#shareType"),
  shareRating: document.querySelector("#shareRating"),
  sharePrice: document.querySelector("#sharePrice"),
  shareMemo: document.querySelector("#shareMemo"),
  shareMonthStat: document.querySelector("#shareMonthStat"),
  shareTotalStat: document.querySelector("#shareTotalStat"),
  periodCount: document.querySelector("#periodCount"),
  periodAverage: document.querySelector("#periodAverage"),
  rankingSubtitle: document.querySelector("#rankingSubtitle"),
};

let entries = loadEntries();
let activeFilter = "all";
let periodMode = "month";
let activePeriod = "";
let rankingMode = "shop";

dateInput.value = toDateInputValue(new Date());
ratingOutput.value = Number(ratingInput.value).toFixed(1);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    id: editingId.value || createId(),
    date: dateInput.value,
    shop: shopInput.value.trim(),
    ramen: ramenInput.value.trim(),
    type: typeInput.value,
    price: parseOptionalNumber(priceInput.value),
    rating: Number(ratingInput.value),
    memo: memoInput.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (!entry.date || !entry.shop || !entry.ramen) return;

  const existingIndex = entries.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  entries = sortEntries(entries);
  saveEntries();
  resetForm();
  render();
});

ratingInput.addEventListener("input", () => {
  ratingOutput.value = Number(ratingInput.value).toFixed(1);
});

todayButton.addEventListener("click", () => {
  dateInput.value = toDateInputValue(new Date());
});

cancelEditButton.addEventListener("click", resetForm);

shareJumpButton.addEventListener("click", () => {
  document.querySelector("#shareStage").scrollIntoView({ behavior: "smooth", block: "center" });
});

searchInput.addEventListener("input", renderHistory);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderHistory();
  });
});

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    periodMode = button.dataset.periodMode;
    periodButtons.forEach((item) => item.classList.toggle("active", item === button));
    activePeriod = "";
    renderPeriodOptions();
    renderPeriodList();
  });
});

periodSelect.addEventListener("change", () => {
  activePeriod = periodSelect.value;
  renderPeriodList();
});

rankingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    rankingMode = button.dataset.ranking;
    rankingButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderRanking();
  });
});

historyList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-button");
  const deleteButton = event.target.closest(".delete-button");

  if (editButton) {
    startEdit(editButton.dataset.id);
    return;
  }

  if (deleteButton) {
    entries = entries.filter((entry) => entry.id !== deleteButton.dataset.id);
    saveEntries();
    render();
  }
});

exportButton.addEventListener("click", () => {
  if (!entries.length) return;

  const header = ["date", "shop", "ramen", "type", "price", "rating", "memo"];
  const rows = entries.map((entry) => [
    entry.date,
    entry.shop,
    entry.ramen,
    entry.type,
    entry.price ?? "",
    entry.rating,
    entry.memo,
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ramen-log-${toDateInputValue(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

render();

function loadEntries() {
  try {
    return sortEntries(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function sortEntries(items) {
  return [...items].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    if (dateOrder !== 0) return dateOrder;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

function render() {
  renderSummary();
  renderShareCard();
  renderHistory();
  renderPeriodOptions();
  renderPeriodList();
  renderRanking();
}

function renderSummary() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((entry) => entry.date.startsWith(currentMonth));
  const ratedEntries = entries.filter((entry) => Number.isFinite(entry.rating));
  const averageRating = ratedEntries.length
    ? ratedEntries.reduce((sum, entry) => sum + entry.rating, 0) / ratedEntries.length
    : null;
  const favorite = getFavoriteShop();

  labels.totalCount.textContent = String(entries.length);
  labels.monthCount.textContent = String(monthEntries.length);
  labels.monthLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  labels.averageRating.textContent = averageRating ? averageRating.toFixed(1) : "--";
  labels.favoriteShop.textContent = favorite ? favorite.shop : "--";
  labels.favoriteShopCount.textContent = favorite ? `${favorite.count}回` : "記録なし";
}

function renderShareCard() {
  const latest = entries[0];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCount = entries.filter((entry) => entry.date.startsWith(currentMonth)).length;

  labels.shareMonthStat.textContent = `今月 ${monthCount}杯`;
  labels.shareTotalStat.textContent = `通算 ${entries.length}杯`;

  if (!latest) {
    labels.shareDate.textContent = "--";
    labels.shareRamen.textContent = "まだ記録がありません";
    labels.shareShop.textContent = "ラーメンを保存するとカードに反映されます";
    labels.shareType.textContent = "--";
    labels.shareRating.textContent = "--";
    labels.sharePrice.textContent = "--";
    labels.shareMemo.textContent = "--";
    return;
  }

  labels.shareDate.textContent = formatDateLong(latest.date);
  labels.shareRamen.textContent = latest.ramen;
  labels.shareShop.textContent = latest.shop;
  labels.shareType.textContent = latest.type || "未選択";
  labels.shareRating.textContent = `★ ${latest.rating.toFixed(1)}`;
  labels.sharePrice.textContent = latest.price == null ? "金額なし" : formatPrice(latest.price);
  labels.shareMemo.textContent = latest.memo || "今日の一杯";
}

function renderHistory() {
  historyList.textContent = "";

  const query = searchInput.value.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    const matchesFilter = activeFilter === "all" || entry.type === activeFilter;
    const searchText = `${entry.shop} ${entry.ramen} ${entry.memo}`.toLowerCase();
    return matchesFilter && searchText.includes(query);
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = entries.length ? "該当する記録がありません" : "まだ記録がありません";
    historyList.append(empty);
    return;
  }

  filtered.forEach((entry) => {
    const item = template.content.cloneNode(true);
    item.querySelector("time").textContent = formatDate(entry.date);
    item.querySelector(".type-badge").textContent = entry.type || "未選択";
    item.querySelector("h3").textContent = entry.ramen;
    item.querySelector(".shop-name").textContent = entry.shop;
    item.querySelector(".memo").textContent = entry.memo || "メモなし";
    item.querySelector(".rating").textContent = `★ ${entry.rating.toFixed(1)}`;
    item.querySelector(".price").textContent = entry.price == null ? "金額なし" : formatPrice(entry.price);
    item.querySelector(".edit-button").dataset.id = entry.id;
    item.querySelector(".delete-button").dataset.id = entry.id;
    historyList.append(item);
  });
}

function renderPeriodOptions() {
  const options = getPeriodOptions();
  const previous = activePeriod || periodSelect.value;

  periodSelect.textContent = "";

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    periodSelect.append(item);
  });

  activePeriod = options.some((option) => option.value === previous) ? previous : options[0]?.value || "";
  periodSelect.value = activePeriod;
}

function renderPeriodList() {
  periodList.textContent = "";

  const periodEntries = entries.filter((entry) => {
    if (!activePeriod) return false;
    return periodMode === "month" ? entry.date.startsWith(activePeriod) : entry.date.startsWith(`${activePeriod}-`);
  });
  const average = getAverageRating(periodEntries);

  labels.periodCount.textContent = `${periodEntries.length}杯`;
  labels.periodAverage.textContent = average ? `平均 ★ ${average.toFixed(1)}` : "平均 --";

  if (!periodEntries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "この期間の記録はありません";
    periodList.append(empty);
    return;
  }

  periodEntries.forEach((entry, index) => {
    const item = document.createElement("article");
    item.className = "period-item";
    item.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div>
        <time>${formatDate(entry.date)}</time>
        <strong>${escapeHtml(entry.ramen)}</strong>
        <p>${escapeHtml(entry.shop)} / ${escapeHtml(entry.type || "未選択")} / ★ ${entry.rating.toFixed(1)}</p>
      </div>
    `;
    periodList.append(item);
  });
}

function renderRanking() {
  rankingList.textContent = "";

  const ranking = getRankingItems();
  const subtitles = {
    shop: "よく食べた店順",
    ramen: "よく食べたラーメン順",
    type: "よく食べた系統順",
    rating: "評価が高い一杯順",
  };
  labels.rankingSubtitle.textContent = subtitles[rankingMode];

  if (!ranking.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "まだランキングがありません";
    rankingList.append(empty);
    return;
  }

  ranking.slice(0, 10).forEach((item, index) => {
    const rank = document.createElement("article");
    rank.className = "ranking-item";
    rank.innerHTML = `
      <span class="rank-number">${index + 1}</span>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      <em>${escapeHtml(item.score)}</em>
    `;
    rankingList.append(rank);
  });
}

function getFavoriteShop() {
  if (!entries.length) return null;

  const counts = entries.reduce((result, entry) => {
    result.set(entry.shop, (result.get(entry.shop) || 0) + 1);
    return result;
  }, new Map());

  return [...counts.entries()]
    .map(([shop, count]) => ({ shop, count }))
    .sort((a, b) => b.count - a.count || a.shop.localeCompare(b.shop))[0];
}

function getPeriodOptions() {
  const values = new Set();
  const now = new Date();

  if (periodMode === "month") {
    values.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    entries.forEach((entry) => values.add(entry.date.slice(0, 7)));
    return [...values].sort((a, b) => b.localeCompare(a)).map((value) => {
      const [year, month] = value.split("-");
      return { value, label: `${year}年${Number(month)}月` };
    });
  }

  values.add(String(now.getFullYear()));
  entries.forEach((entry) => values.add(entry.date.slice(0, 4)));
  return [...values].sort((a, b) => b.localeCompare(a)).map((value) => ({ value, label: `${value}年` }));
}

function getRankingItems() {
  if (rankingMode === "rating") {
    return entries
      .map((entry) => ({
        name: entry.ramen,
        detail: `${entry.shop} / ${formatDate(entry.date)}`,
        score: `★ ${entry.rating.toFixed(1)}`,
      }))
      .sort((a, b) => Number(b.score.slice(2)) - Number(a.score.slice(2)));
  }

  const keyMap = {
    shop: (entry) => entry.shop,
    ramen: (entry) => entry.ramen,
    type: (entry) => entry.type || "未選択",
  };
  const groups = entries.reduce((result, entry) => {
    const key = keyMap[rankingMode](entry);
    const current = result.get(key) || { name: key, count: 0, ratings: [], latestDate: entry.date };
    current.count += 1;
    current.ratings.push(entry.rating);
    if (entry.date > current.latestDate) current.latestDate = entry.date;
    result.set(key, current);
    return result;
  }, new Map());

  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      detail: `平均 ★ ${getAverageRatingFromNumbers(group.ratings).toFixed(1)} / 最新 ${formatDate(group.latestDate)}`,
      score: `${group.count}杯`,
      count: group.count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getAverageRating(items) {
  if (!items.length) return null;
  return items.reduce((sum, entry) => sum + entry.rating, 0) / items.length;
}

function getAverageRatingFromNumbers(items) {
  if (!items.length) return 0;
  return items.reduce((sum, value) => sum + value, 0) / items.length;
}

function startEdit(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  editingId.value = entry.id;
  dateInput.value = entry.date;
  shopInput.value = entry.shop;
  ramenInput.value = entry.ramen;
  typeInput.value = entry.type;
  priceInput.value = entry.price ?? "";
  ratingInput.value = String(entry.rating);
  ratingOutput.value = entry.rating.toFixed(1);
  memoInput.value = entry.memo;
  formTitle.textContent = "編集する";
  saveButton.textContent = "更新";
  cancelEditButton.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  form.reset();
  editingId.value = "";
  dateInput.value = toDateInputValue(new Date());
  ratingInput.value = "4";
  ratingOutput.value = "4.0";
  formTitle.textContent = "記録する";
  saveButton.textContent = "保存";
  cancelEditButton.hidden = true;
}

function parseOptionalNumber(value) {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatDateLong(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatPrice(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeCsvValue(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
