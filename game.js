const field = document.getElementById('forest');
const cashValue = document.getElementById('cashValue');
const treesCutValue = document.getElementById('treesCutValue');
const goalValue = document.getElementById('goalValue');
const toolName = document.getElementById('toolName');
const attackPowerValue = document.getElementById('attackPowerValue');
const autoIncomeValue = document.getElementById('autoIncomeValue');
const forestLevelValue = document.getElementById('forestLevelValue');
const goalProgress = document.getElementById('goalProgress');
const goalProgressLabel = document.getElementById('goalProgressLabel');
const messageBox = document.getElementById('messageBox');
const shopList = document.getElementById('shopList');
const nextForestBtn = document.getElementById('nextForestBtn');

const state = {
  cash: 20,
  treesCut: 0,
  goal: 1000,
  toolLevel: 1,
  forestLevel: 1,
  treeHealth: 1,
  autoIncome: 0,
  upgrades: {
    axe: 0,
    chainsaw: 0,
    vehicle: 0,
    workers: 0,
    factory: 0,
  },
  ownedTools: {
    rustyAxe: true,
    handAxe: false,
    chainsaw: false,
    skidder: false,
  },
  currentTool: 'rustyAxe',
  forest: [],
  lastTick: 0,
};

const toolCatalog = {
  rustyAxe: { name: 'Rusty Axe', basePower: 1, cost: 0, unlock: 0 },
  handAxe: { name: 'Hand Axe', basePower: 4, cost: 55, unlock: 1 },
  chainsaw: { name: 'Chainsaw', basePower: 15, cost: 180, unlock: 2 },
  skidder: { name: 'Skidder', basePower: 45, cost: 460, unlock: 3 },
};

const shopItems = [
  {
    id: 'axeUpgrade',
    name: 'Sharpen axe',
    description: 'Boost your axe damage and cut deeper into each trunk.',
    baseCost: 25,
    getCost: (state) => Math.round(25 * Math.pow(1.45, state.upgrades.axe)),
    buy: () => {
      state.upgrades.axe += 1;
      state.cash -= getItemCost('axeUpgrade');
      state.treeHealth = Math.max(1, state.treeHealth * 0.9);
      pushMessage('Your blade is sharper. Every swing does more work.');
    },
  },
  {
    id: 'chainsaw',
    name: 'Buy chainsaw',
    description: 'A gas-powered saw for fast chopping in dense forests.',
    baseCost: 180,
    getCost: (state) => 180 + state.upgrades.chainsaw * 160,
    buy: () => {
      if (!state.ownedTools.chainsaw) {
        state.ownedTools.chainsaw = true;
        state.currentTool = 'chainsaw';
        state.toolLevel = 3;
      }
      state.upgrades.chainsaw += 1;
      state.cash -= getItemCost('chainsaw');
      pushMessage('The chainsaw hums to life. The forest will soon fall.');
    },
  },
  {
    id: 'skidder',
    name: 'Buy skidder',
    description: 'A powered vehicle that helps collect logs and speed movement.',
    baseCost: 460,
    getCost: (state) => 460 + state.upgrades.vehicle * 320,
    buy: () => {
      if (!state.ownedTools.skidder) {
        state.ownedTools.skidder = true;
        state.currentTool = 'skidder';
        state.toolLevel = 4;
      }
      state.upgrades.vehicle += 1;
      state.cash -= getItemCost('skidder');
      state.autoIncome += 1.4;
      pushMessage('The skidder arrives. Logs are moving fast and profit is rising.');
    },
  },
  {
    id: 'workers',
    name: 'Hire workers',
    description: 'Add a few lumberjacks who earn money while you chop.',
    baseCost: 140,
    getCost: (state) => 140 + state.upgrades.workers * 140,
    buy: () => {
      state.upgrades.workers += 1;
      state.cash -= getItemCost('workers');
      state.autoIncome += 1.8;
      pushMessage('Workers join the camp. The payroll is rolling in.');
    },
  },
  {
    id: 'factory',
    name: 'Build sawmill',
    description: 'A production line that automatically converts logs into cash.',
    baseCost: 900,
    getCost: (state) => 900 + state.upgrades.factory * 820,
    buy: () => {
      state.upgrades.factory += 1;
      state.cash -= getItemCost('factory');
      state.autoIncome += 6;
      pushMessage('The sawmill is online. Your lumber empire is scaling up.');
    },
  },
];

function getItemCost(itemId) {
  const item = shopItems.find((entry) => entry.id === itemId);
  if (!item) return 0;
  return item.getCost(state);
}

function formatMoney(value) {
  return `$${value.toFixed(0)}`;
}

function updateHeaderStats() {
  cashValue.textContent = formatMoney(state.cash);
  treesCutValue.textContent = state.treesCut;
  goalValue.textContent = state.goal;

  const tool = getCurrentTool();
  toolName.textContent = tool.name;
  attackPowerValue.textContent = tool.basePower + state.upgrades.axe * 2;
  autoIncomeValue.textContent = `${formatMoney(state.autoIncome)}/s`;
  forestLevelValue.textContent = state.forestLevel;
  goalProgress.style.width = `${Math.min((state.treesCut / state.goal) * 100, 100)}%`;
  goalProgressLabel.textContent = `${state.treesCut}/${state.goal} trees cleared`;
}

function pushMessage(message) {
  messageBox.textContent = message;
}

function getCurrentTool() {
  return toolCatalog[state.currentTool] || toolCatalog.rustyAxe;
}

function getTreeHealthForLevel(treeIndex) {
  const base = (state.forestLevel * 1.5) + Math.floor(treeIndex / 3) * 0.9;
  return Number((base + (state.treesCut * 0.01)).toFixed(2));
}

function createTree(index) {
  const tree = document.createElement('button');
  tree.type = 'button';
  tree.className = 'tree';
  tree.setAttribute('aria-label', `Tree ${index + 1}`);
  const treeHealth = getTreeHealthForLevel(index);
  tree.dataset.health = String(treeHealth);
  tree.dataset.index = String(index);
  tree.innerHTML = `
    <div class="tree-strength">${treeHealth.toFixed(1)}</div>
    <div class="crown" style="--tree-color:${getTreeColor(index)}"></div>
    <div class="trunk"></div>
  `;

  tree.addEventListener('click', () => chopTree(tree));
  return tree;
}

function getTreeColor(index) {
  const shades = ['#4caf50', '#5b9f4a', '#7fb857', '#4d8c3d', '#76a15a'];
  return shades[index % shades.length];
}

function renderForest() {
  field.innerHTML = '';
  state.forest.forEach((treeElement) => field.appendChild(treeElement));
}

function spawnForest() {
  state.forest = Array.from({ length: 12 }, (_, index) => createTree(index));
  renderForest();
}

function updateShop() {
  shopList.innerHTML = '';

  shopItems.forEach((item) => {
    const entry = document.createElement('div');
    entry.className = 'shop-item';
    const cost = getItemCost(item.id);
    const affordable = state.cash >= cost;

    const canBuy = item.id === 'axeUpgrade' ? true : item.id === 'chainsaw' ? !state.ownedTools.chainsaw || state.upgrades.chainsaw < 99 : item.id === 'skidder' ? !state.ownedTools.skidder || state.upgrades.vehicle < 99 : true;

    entry.innerHTML = `
      <div class="shop-item-header">
        <h3>${item.name}</h3>
        <span>${formatMoney(cost)}</span>
      </div>
      <p>${item.description}</p>
      <button class="buy-btn" ${!canBuy || !affordable ? 'disabled' : ''}>${affordable ? 'Buy' : 'Need more cash'}</button>
    `;

    const button = entry.querySelector('button');
    button.addEventListener('click', () => {
      if (state.cash < cost || !canBuy) return;
      item.buy();
      updateAll();
    });

    shopList.appendChild(entry);
  });
}

function chopTree(treeButton) {
  const index = Number(treeButton.dataset.index);
  const currentTool = getCurrentTool();
  const damage = currentTool.basePower + state.upgrades.axe * 2 + state.upgrades.chainsaw * 3 + state.upgrades.vehicle * 4;

  const treeHealth = Number(treeButton.dataset.health) || 1;
  const newHealth = treeHealth - damage;

  if (newHealth <= 0) {
    treeButton.classList.add('chopped');
    treeButton.disabled = true;
    state.treesCut += 1;
    state.cash += 3 + state.forestLevel * 1.5 + state.upgrades.workers * 0.8;
    const bonus = state.forestLevel > 1 ? state.forestLevel * 2 : 0;
    state.cash += bonus;
    pushMessage(`Tree felled! +${formatMoney(3 + state.forestLevel * 1.5 + bonus)}. ${state.treesCut} trees down.`);
    if (state.treesCut >= state.goal) {
      pushMessage(`Victory! You cut all ${state.goal} trees and became the legend of the forest.`);
    }
    treeButton.dataset.health = '0';
    setTimeout(() => {
      if (!treeButton.classList.contains('chopped')) return;
      treeButton.remove();
      const replacement = createTree(index);
      state.forest[index] = replacement;
      renderForest();
    }, 220);
  } else {
    treeButton.dataset.health = String(newHealth);
    treeButton.querySelector('.tree-strength').textContent = newHealth.toFixed(1);
    pushMessage(`You hit the tree. ${newHealth.toFixed(1)} strength left.`);
  }

  updateHeaderStats();
  updateShop();
}

function checkForestLevel() {
  const target = Math.floor(state.treesCut / 200) + 1;
  if (target > state.forestLevel) {
    state.forestLevel = target;
    pushMessage(`Forest level increased to ${state.forestLevel}. Bigger trees are appearing.`);
    state.forest.forEach((tree) => {
      const current = Number(tree.dataset.health) || 1;
      tree.dataset.health = String(current + 6 + state.forestLevel * 0.7);
      tree.querySelector('.tree-strength').textContent = (Number(tree.dataset.health)).toFixed(1);
    });
  }
}

function advanceForest() {
  state.cash += state.autoIncome;
  if (state.treesCut >= state.goal) {
    state.goal += 350;
    state.treesCut = 0;
    state.forestLevel += 1;
    pushMessage('A new frontier opens. The next forest is tougher, with higher rewards.');
  }
  updateAll();
}

function updateAll() {
  updateHeaderStats();
  checkForestLevel();
  updateShop();
}

nextForestBtn.addEventListener('click', () => {
  state.forestLevel += 1;
  spawnForest();
  pushMessage(`The woods are refreshed. Forest level ${state.forestLevel} is now active.`);
  updateAll();
});

setInterval(() => {
  state.cash += state.autoIncome / 2;
  updateHeaderStats();
  updateShop();
}, 500);

setInterval(() => {
  advanceForest();
}, 5000);

spawnForest();
updateAll();
