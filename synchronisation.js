// SMARTLOC - Système de synchronisation des données
// Version 2.0 - Harmonisation complète

const SMARTLOC_CONFIG = {
  version: '2.0',
  requiredFields: {
    appartement: ['nom', 'proprietaireNom', 'cout', 'locataire', 'dateEntree'],
    proprietaire: ['nom'],
    compta: ['pourcentage', 'date']
  },
  defaults: {
    commissionPDG: 10,
    ville: 'Non spécifié',
    quartier: 'Non spécifié',
    avance: 0
  }
};

// Fonction de migration des données anciennes
function migrerDonneesAnciennes() {
  console.log('🔧 Migration des données SmartLoc...');
  
  const appartements = JSON.parse(localStorage.getItem('appartements')) || [];
  let modifications = 0;
  
  appartements.forEach((apt, index) => {
    // Standardisation des champs de date
    if (apt.date && !apt.dateEntree) {
      apt.dateEntree = apt.date;
      modifications++;
    }
    if (apt.date && !apt.dateIntegration) {
      apt.dateIntegration = apt.date;
      modifications++;
    }
    
    // Champs par défaut
    if (!apt.ville || apt.ville.trim() === '') {
      apt.ville = SMARTLOC_CONFIG.defaults.ville;
      modifications++;
    }
    if (!apt.quartier || apt.quartier.trim() === '') {
      apt.quartier = SMARTLOC_CONFIG.defaults.quartier;
      modifications++;
    }
    if (!apt.avance || apt.avance === 0) {
      apt.avance = SMARTLOC_CONFIG.defaults.avance;
      modifications++;
    }
    
    // Vérifier l'existence du propriétaire
    const proprios = JSON.parse(localStorage.getItem('smartloc_proprios')) || [];
    if (apt.proprietaireNom && !proprios.find(p => p.nom === apt.proprietaireNom)) {
      console.warn(`⚠️ Propriétaire "${apt.proprietaireNom}" non trouvé dans la liste des propriétaires`);
    }
  });
  
  if (modifications > 0) {
    localStorage.setItem('appartements', JSON.stringify(appartements));
    console.log(`✅ ${modifications} modifications appliquées`);
  }
  
  return modifications;
}

// Synchronisation propriétaires/appartements
function synchroniserPropriosAppartements() {
  const appartements = JSON.parse(localStorage.getItem('appartements')) || [];
  const proprios = JSON.parse(localStorage.getItem('smartloc_proprios')) || [];
  
  const nomsProprios = proprios.map(p => p.nom);
  const appartementsValides = [];
  const appartementsOrphelins = [];
  
  appartements.forEach(apt => {
    if (apt.proprietaireNom && nomsProprios.includes(apt.proprietaireNom)) {
      appartementsValides.push(apt);
    } else {
      appartementsOrphelins.push(apt.nom);
    }
  });
  
  if (appartementsOrphelins.length > 0) {
    console.warn(`🏚️ Appartements orphelins: ${appartementsOrphelins.join(', ')}`);
  }
  
  localStorage.setItem('appartements', JSON.stringify(appartementsValides));
  
  return {
    total: appartements.length,
    valides: appartementsValides.length,
    orphelins: appartementsOrphelins.length
  };
}

// Vérification d'intégrité des données
function verifierIntegriteDonnees() {
  const problemes = [];
  
  // 1. Vérifier les appartements
  const appartements = JSON.parse(localStorage.getItem('appartements')) || [];
  const proprios = JSON.parse(localStorage.getItem('smartloc_proprios')) || [];
  const comptaConfig = JSON.parse(localStorage.getItem('compta_config')) || {};
  
  // Appartements sans propriétaire connu
  const nomsProprios = proprios.map(p => p.nom);
  const sansProprio = appartements.filter(a => !nomsProprios.includes(a.proprietaireNom));
  if (sansProprio.length > 0) {
    problemes.push({
      type: 'proprietaire',
      message: `${sansProprio.length} appartement(s) avec propriétaire inconnu`,
      details: sansProprio.map(a => a.nom)
    });
  }
  
  // Appartements sans configuration PDG
  const sansConfig = [];
  appartements.forEach((apt, index) => {
    if (!comptaConfig[index]) {
      sansConfig.push(apt.nom);
    }
  });
  if (sansConfig.length > 0) {
    problemes.push({
      type: 'compta',
      message: `${sansConfig.length} bien(s) non configuré(s) pour les commissions PDG`,
      details: sansConfig
    });
  }
  
  // Propriétaires sans appartements
  const proprioSansApt = proprios.filter(p => {
    const aptsDuProprio = appartements.filter(a => a.proprietaireNom === p.nom);
    return aptsDuProprio.length === 0;
  });
  if (proprioSansApt.length > 0) {
    problemes.push({
      type: 'proprietaire_vide',
      message: `${proprioSansApt.length} propriétaire(s) sans appartement assigné`,
      details: proprioSansApt.map(p => p.nom)
    });
  }
  
  return problemes;
}

// Initialisation au chargement
function initialiserSmartLoc() {
  console.log('🚀 Initialisation SmartLoc v2.0');
  
  // Migration si nécessaire
  migrerDonneesAnciennes();
  
  // Synchronisation
  const syncResult = synchroniserPropriosAppartements();
  
  // Vérification
  const problemes = verifierIntegriteDonnees();
  
  return {
    sync: syncResult,
    problemes: problemes,
    timestamp: new Date().toISOString()
  };
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
  window.SmartLocSync = {
    config: SMARTLOC_CONFIG,
    migrer: migrerDonneesAnciennes,
    synchroniser: synchroniserPropriosAppartements,
    verifier: verifierIntegriteDonnees,
    initialiser: initialiserSmartLoc
  };
}