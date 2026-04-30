import './styles/index.css';
import { store } from './data/store.js';
import { renderSetup } from './views/setup.js';
import { renderDashboard } from './views/dashboard.js';

const app = document.getElementById('app');

function render() {
  app.innerHTML = '';
  
  if (store.currentView === 'setup') {
    renderSetup(app);
  } else {
    renderDashboard(app);
  }
}

store.subscribe(render);
render();
