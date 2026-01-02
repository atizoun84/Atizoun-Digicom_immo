// pwa-setup.js - Configuration PWA pour SmartLoc

class PWAManager {
  constructor() {
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches;
    this.init();
  }
  
  init() {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
    
    // Détecter l'installation
    this.detectInstallPrompt();
    
    // Gérer les mises à jour
    this.handleUpdates();
  }
  
  registerServiceWorker() {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('✅ Service Worker enregistré avec succès');
          this.registration = registration;
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Nouvelle version du Service Worker trouvée');
          });
        })
        .catch(error => {
          console.error('❌ Échec de l\'enregistrement du Service Worker:', error);
        });
    });
  }
  
  detectInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Afficher un bouton d'installation
      this.showInstallButton(deferredPrompt);
    });
  }
  
  showInstallButton(deferredPrompt) {
    // Créer un bouton d'installation flottant
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '📱 Installer l\'app';
    installBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 9999;
            background: #003366;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
    
    installBtn.onclick = () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ Application installée');
        }
        installBtn.remove();
      });
    };
    
    document.body.appendChild(installBtn);
    
    // Cacher après 10 secondes
    setTimeout(() => {
      if (installBtn.parentNode) {
        installBtn.remove();
      }
    }, 10000);
  }
  
  handleUpdates() {
    // Vérifier les mises à jour périodiquement
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Nouveau Service Worker activé, rechargement...');
        window.location.reload();
      });
    }
  }
  
  // Sauvegarde offline
  saveForOffline(key, data) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_DATA',
        key: key,
        data: data
      });
    }
  }
  
  // Récupération offline
  getOfflineData(key) {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_DATA',
          key: key
        }, [channel.port2]);
        
        channel.port1.onmessage = (e) => {
          resolve(e.data);
        };
      } else {
        resolve(null);
      }
    });
  }
}

// Initialiser globalement
if (typeof window !== 'undefined') {
  window.PWAManager = new PWAManager();
}