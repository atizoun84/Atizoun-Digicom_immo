// initialisation.js
class SmartLocInitialisation {
  constructor() {
    this.isFirstRun = this.checkFirstRun();
    this.init();
  }
  
  checkFirstRun() {
    const params = localStorage.getItem('smartloc_params');
    const users = localStorage.getItem('smartloc_users');
    const appartements = localStorage.getItem('appartements');
    return !params && !users && !appartements;
  }
  
  init() {
    if (this.isFirstRun) {
      console.log('🚀 Première exécution - Initialisation admin2025');
      this.setupDefaultAdmin();
      this.showWelcomeMessage();
    }
  }
  
  setupDefaultAdmin() {
    const defaultParams = {
      pdgNom: "Atizoun Plateny AMOUSSOU",
      adminPass: "admin2025",
      pdgSig: null,
      societeTel: "01 97 74 40 35",
      societeEmail: "atizoun@gmail.com",
      firstRun: new Date().toISOString()
    };
    
    const defaultUsers = [{
      id: "admin",
      pass: "admin2025",
      role: "admin"
    }];
    
    localStorage.setItem('smartloc_params', JSON.stringify(defaultParams));
    localStorage.setItem('smartloc_users', JSON.stringify(defaultUsers));
    localStorage.setItem('smartloc_proprios', JSON.stringify([]));
    localStorage.setItem('appartements', JSON.stringify([]));
    localStorage.setItem('paiements', JSON.stringify({}));
    localStorage.setItem('compta_config', JSON.stringify({}));
    localStorage.setItem('retraits_commission', JSON.stringify({}));
    localStorage.setItem('retraits_proprio', JSON.stringify({}));
    localStorage.setItem('smartloc_session', JSON.stringify({}));
  }
  
  showWelcomeMessage() {
    setTimeout(() => {
      if (window.location.pathname.includes('login.html') || window.location.pathname.includes('index.html')) {
        alert('👋 Bienvenue dans SmartLoc !\n\n🔑 CONNEXION ADMIN :\nUtilisateur: admin\nMot de passe: admin2025\n\n⚠️ Changez ce mot de passe dans "Paramètres".');
      }
    }, 1000);
  }
}

if (typeof window !== 'undefined') {
  window.SmartLocInit = new SmartLocInitialisation();
}