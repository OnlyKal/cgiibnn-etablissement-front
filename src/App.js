import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix Leaflet default marker icons (webpack asset path issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const CREATE_STEPS = [
  { num: 1,  label: 'Identification' },
  { num: 2,  label: 'Localisation' },
  { num: 3,  label: 'Autorisation' },
  { num: 4,  label: 'Comité de gestion' },
  { num: 5,  label: 'Ressources humaines' },
  { num: 6,  label: 'Organisation académique' },
  { num: 7,  label: 'Patrimoine' },
  { num: 8,  label: 'Gestion' },
  { num: 9,  label: 'Contrôles' },
  { num: 10, label: 'École doctorale' },
  { num: 11, label: 'Marchés publics' },
  { num: 12, label: 'Soumissionnaire' },
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://admin.cgiibnn-esursi.cd/';

const API_PATHS = {
  list: process.env.REACT_APP_API_LIST_PATH || 'api/etablissements/',
  create: process.env.REACT_APP_API_CREATE_PATH || 'api/etablissements/create/',
  updateById:
    process.env.REACT_APP_API_UPDATE_BY_ID_PATH ||
    'api/etablissements/{id}/update/',
  updateByCode:
    process.env.REACT_APP_API_UPDATE_BY_CODE_PATH ||
    'api/etablissements/code/{code}/update/',
};

function buildUrl(path) {
  return new URL(path, API_BASE_URL).toString();
}

function buildUrlWithParams(path, params = {}) {
  let finalPath = path;
  Object.entries(params).forEach(([key, value]) => {
    finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
  });
  return buildUrl(finalPath);
}



function normalizeEtablissement(item) {
  return {
    ...item,
    id: item.id,
    nom_etablissement: item.nom_etablissement || item.nom || item.name || '',
    sigle_etablissement: item.sigle_etablissement || item.sigle || '',
    statut: (item.statut || '').toLowerCase(),
    etat: item.etat || 'soumis',
    logo: item.logo || null,
    pris_en_charge_par_etat: Boolean(item.pris_en_charge_par_etat),
    acte_prise_en_charge: item.acte_prise_en_charge || null,
    convention_etat_rdc: item.convention_etat_rdc || null,
    adresse: item.adresse || '',
    rue_avenue: item.rue_avenue || '',
    commune: item.commune || '',
    ville_localite: item.ville_localite || '',
    province: item.province || '',
    telephone: item.telephone || '',
    email: item.email || '',
    latitude: item.latitude != null ? String(item.latitude) : '',
    longitude: item.longitude != null ? String(item.longitude) : '',
    date_creation: item.date_creation || '',
    acte_creation: item.acte_creation || null,
    acte_fonctionnement: item.acte_fonctionnement || null,
    acte_agrement: item.acte_agrement || null,
    recteur_nom: item.recteur_nom || '',
    recteur_sexe: item.recteur_sexe || '',
    recteur_grade: item.recteur_grade || '',
    recteur_telephone: item.recteur_telephone || '',
    recteur_email: item.recteur_email || '',
    recteur_arrete: item.recteur_arrete || null,
    recteur_en_fonction: item.recteur_en_fonction != null ? Boolean(item.recteur_en_fonction) : true,
    recteur_hors_fonction_depuis: item.recteur_hors_fonction_depuis || '',
    recteur_hors_fonction_motif: item.recteur_hors_fonction_motif || '',
    sga_nom: item.sga_nom || '',
    sga_sexe: item.sga_sexe || '',
    sga_grade: item.sga_grade || '',
    sga_telephone: item.sga_telephone || '',
    sga_email: item.sga_email || '',
    sga_arrete: item.sga_arrete || null,
    sga_en_fonction: item.sga_en_fonction != null ? Boolean(item.sga_en_fonction) : true,
    sga_hors_fonction_depuis: item.sga_hors_fonction_depuis || '',
    sga_hors_fonction_motif: item.sga_hors_fonction_motif || '',
    ab_nom: item.ab_nom || '',
    ab_sexe: item.ab_sexe || '',
    ab_grade: item.ab_grade || '',
    ab_telephone: item.ab_telephone || '',
    ab_email: item.ab_email || '',
    ab_arrete: item.ab_arrete || null,
    ab_en_fonction: item.ab_en_fonction != null ? Boolean(item.ab_en_fonction) : true,
    ab_hors_fonction_depuis: item.ab_hors_fonction_depuis || '',
    ab_hors_fonction_motif: item.ab_hors_fonction_motif || '',
    sgr_nom: item.sgr_nom || '',
    sgr_sexe: item.sgr_sexe || '',
    sgr_grade: item.sgr_grade || '',
    sgr_telephone: item.sgr_telephone || '',
    sgr_email: item.sgr_email || '',
    sgr_arrete: item.sgr_arrete || null,
    sgr_en_fonction: item.sgr_en_fonction != null ? Boolean(item.sgr_en_fonction) : true,
    sgr_hors_fonction_depuis: item.sgr_hors_fonction_depuis || '',
    sgr_hors_fonction_motif: item.sgr_hors_fonction_motif || '',
    total_enseignants: item.total_enseignants != null ? String(item.total_enseignants) : '',
    pa: item.pa != null ? String(item.pa) : '',
    p: item.p != null ? String(item.p) : '',
    po: item.po != null ? String(item.po) : '',
    enseignants_femmes: item.enseignants_femmes != null ? String(item.enseignants_femmes) : '',
    personnel_scientifique: item.personnel_scientifique != null ? String(item.personnel_scientifique) : '',
    personnel_scientifique_femmes: item.personnel_scientifique_femmes != null ? String(item.personnel_scientifique_femmes) : '',
    pato: item.pato != null ? String(item.pato) : '',
    filieres: Array.isArray(item.filieres)
      ? item.filieres.map((f) => ({
          nom: f.nom || f.name || String(f),
          effectifs: Array.isArray(f.effectifs) ? f.effectifs.map((e) => ({
            annee: e.annee != null ? String(e.annee) : '',
            total: e.total != null ? String(e.total) : '',
            masculin: e.masculin != null ? String(e.masculin) : '',
            feminin: e.feminin != null ? String(e.feminin) : '',
          })) : [],
        }))
      : [],
    licence: Boolean(item.licence),
    master: Boolean(item.master),
    doctorat: Boolean(item.doctorat),
    autres_niveaux: item.autres_niveaux || '',
    effectif_licence_total: item.effectif_licence_total != null ? String(item.effectif_licence_total) : '',
    effectif_master_total: item.effectif_master_total != null ? String(item.effectif_master_total) : '',
    effectif_doctorat_total: item.effectif_doctorat_total != null ? String(item.effectif_doctorat_total) : '',
    nombre_etudiants_lmd: item.nombre_etudiants_lmd != null ? String(item.nombre_etudiants_lmd) : '',
    titre_propriete_propriete: item.titre_propriete_propriete || null,
    nombre_residences_personnel: item.nombre_residences_personnel != null ? String(item.nombre_residences_personnel) : '',
    nombre_residences_estudiantines: item.nombre_residences_estudiantines != null ? String(item.nombre_residences_estudiantines) : '',
    est_locataire: Boolean(item.est_locataire),
    biens_sans_titre_foncier: item.biens_sans_titre_foncier || '',
    responsable_patrimoine_nom: item.responsable_patrimoine_nom || '',
    responsable_patrimoine_telephone: item.responsable_patrimoine_telephone || '',
    responsable_patrimoine_email: item.responsable_patrimoine_email || '',
    organigramme_existe: Boolean(item.organigramme_existe),
    organigramme_fichier: item.organigramme_fichier || null,
    audit_interne: Boolean(item.audit_interne),
    date_dernier_controle_viabilite: item.date_dernier_controle_viabilite || '',
    date_dernier_controle_gestion: item.date_dernier_controle_gestion || '',
    date_dernier_controle_scolarite: item.date_dernier_controle_scolarite || '',
    ecole_doctorale: Boolean(item.ecole_doctorale),
    acte_ecole_doctorale: item.acte_ecole_doctorale || null,
    cellule_marches_publics: Boolean(item.cellule_marches_publics),
    marches_publics: Array.isArray(item.marches_publics)
      ? item.marches_publics.map((m) => ({ nom: m.nom || '', telephone: m.telephone || '', email: m.email || '' }))
      : [],
    accords_mobilite: Array.isArray(item.accords_mobilite)
      ? item.accords_mobilite.map((a) => ({ accord: a.accord || '' }))
      : [],
    description: item.description || '',
  };
}

function emptyCreateForm() {
  return {
    nom_etablissement: '',
    sigle_etablissement: '',
    statut: 'public',
    etat: 'soumis',
    logo: null,
    pris_en_charge_par_etat: false,
    acte_prise_en_charge: null,
    convention_etat_rdc: null,
    adresse: '',
    rue_avenue: '',
    commune: '',
    ville_localite: '',
    province: '',
    telephone: '',
    email: '',
    latitude: '',
    longitude: '',
    date_creation: '',
    acte_creation: null,
    acte_fonctionnement: null,
    acte_agrement: null,
    recteur_nom: '',
    recteur_sexe: '',
    recteur_grade: '',
    recteur_telephone: '',
    recteur_email: '',
    recteur_arrete: null,
    recteur_en_fonction: true,
    recteur_hors_fonction_depuis: '',
    recteur_hors_fonction_motif: '',
    sga_nom: '',
    sga_sexe: '',
    sga_grade: '',
    sga_telephone: '',
    sga_email: '',
    sga_arrete: null,
    sga_en_fonction: true,
    sga_hors_fonction_depuis: '',
    sga_hors_fonction_motif: '',
    ab_nom: '',
    ab_sexe: '',
    ab_grade: '',
    ab_telephone: '',
    ab_email: '',
    ab_arrete: null,
    ab_en_fonction: true,
    ab_hors_fonction_depuis: '',
    ab_hors_fonction_motif: '',
    sgr_nom: '',
    sgr_sexe: '',
    sgr_grade: '',
    sgr_telephone: '',
    sgr_email: '',
    sgr_arrete: null,
    sgr_en_fonction: true,
    sgr_hors_fonction_depuis: '',
    sgr_hors_fonction_motif: '',
    total_enseignants: '',
    pa: '',
    p: '',
    po: '',
    enseignants_femmes: '',
    chefs_travaux: '',
    assistants: '',
    charges_pratiques_professionnelles: '',
    personnel_scientifique_femmes: '',
    cadres_commandement: '',
    cadres_collaboration: '',
    agents_execution: '',
    filieres: [],
    licence: false,
    master: false,
    doctorat: false,
    autres_niveaux: '',
    effectif_licence_total: '',
    effectif_master_total: '',
    effectif_doctorat_total: '',
    nombre_etudiants_lmd: '',
    titre_propriete_propriete: null,
    nombre_residences_personnel: '',
    nombre_residences_estudiantines: '',
    est_locataire: null,
    biens_sans_titre_foncier: '',
    responsable_patrimoine_nom: '',
    responsable_patrimoine_telephone: '',
    responsable_patrimoine_email: '',
    organigramme_existe: false,
    organigramme_fichier: null,
    audit_interne: false,
    date_dernier_controle_viabilite: '',
    date_dernier_controle_gestion: '',
    date_dernier_controle_scolarite: '',
    ecole_doctorale: false,
    acte_ecole_doctorale: null,
    cellule_marches_publics: false,
    marches_publics: [],
    accords_mobilite: [],
    description: '',
    soumissionnaire_nom: '',
    soumissionnaire_email: '',
    soumissionnaire_telephone: '',
  };
}

const CREATE_FIELD_STEPS = {
  nom_etablissement: 1,
  sigle_etablissement: 1,
  statut: 1,
  acte_prise_en_charge: 1,
  convention_etat_rdc: 1,
  adresse: 2,
  rue_avenue: 2,
  commune: 2,
  ville_localite: 2,
  province: 2,
  telephone: 2,
  email: 2,
  date_creation: 3,
  acte_creation: 3,
  acte_fonctionnement: 3,
  acte_agrement: 3,
  recteur_nom: 4,
  recteur_sexe: 4,
  recteur_grade: 4,
  recteur_telephone: 4,
  recteur_email: 4,
  recteur_arrete: 4,
  sga_nom: 4,
  sga_sexe: 4,
  sga_grade: 4,
  sga_telephone: 4,
  sga_email: 4,
  sga_arrete: 4,
  ab_nom: 4,
  ab_sexe: 4,
  ab_grade: 4,
  ab_telephone: 4,
  ab_email: 4,
  ab_arrete: 4,
  sgr_nom: 4,
  sgr_sexe: 4,
  sgr_grade: 4,
  sgr_telephone: 4,
  sgr_email: 4,
  sgr_arrete: 4,
  total_enseignants: 5,
  pa: 5,
  p: 5,
  po: 5,
  enseignants_femmes: 5,
  chefs_travaux: 5,
  assistants: 5,
  charges_pratiques_professionnelles: 5,
  personnel_scientifique_femmes: 5,
  cadres_commandement: 5,
  cadres_collaboration: 5,
  agents_execution: 5,
  filieres: 6,
  accords_mobilite: 6,
  niveaux_etudes: 6,
  autres_niveaux: 6,
  effectif_licence_total: 6,
  effectif_master_total: 6,
  effectif_doctorat_total: 6,
  nombre_etudiants_lmd: 6,
  titre_propriete_propriete: 7,
  nombre_residences_personnel: 7,
  nombre_residences_estudiantines: 7,
  est_locataire: 7,
  biens_sans_titre_foncier: 7,
  responsable_patrimoine_nom: 7,
  responsable_patrimoine_telephone: 7,
  responsable_patrimoine_email: 7,
  marches_publics: 11,
  marche_nom: 11,
  marche_telephone: 11,
  marche_email: 11,
  soumissionnaire_nom: 12,
  soumissionnaire_email: 12,
  soumissionnaire_telephone: 12,
};

const CREATE_FIELD_LABELS = {
  nom_etablissement: 'Nom de l\'établissement',
  sigle_etablissement: 'Sigle de l\'établissement',
  statut: 'Statut',
  acte_prise_en_charge: 'Acte de prise en charge',
  convention_etat_rdc: 'Convention de l\'État',
  adresse: 'Adresse',
  rue_avenue: 'Rue / Avenue',
  commune: 'Commune',
  ville_localite: 'Ville / Localité',
  province: 'Province',
  telephone: 'Téléphone',
  email: 'Email',
  date_creation: 'Date de création',
  acte_creation: 'Acte juridique de création',
  acte_fonctionnement: 'Acte juridique d\'autorisation de fonctionnement',
  acte_agrement: 'Acte juridique d\'agrément',
  recteur_nom: 'Nom complet du Recteur / DG',
  recteur_sexe: 'Sexe du Recteur / DG',
  recteur_grade: 'Grade du Recteur / DG',
  recteur_telephone: 'Téléphone du Recteur / DG',
  recteur_email: 'E-mail du Recteur / DG',
  recteur_arrete: 'Arrêté de nomination du Recteur / DG',
  sga_nom: 'Nom complet du SGA',
  sga_sexe: 'Sexe du SGA',
  sga_grade: 'Grade du SGA',
  sga_telephone: 'Téléphone du SGA',
  sga_email: 'Email du SGA',
  sga_arrete: 'Arrêté de nomination du SGA',
  ab_nom: 'Nom complet de l\'AB',
  ab_sexe: 'Sexe de l\'AB',
  ab_grade: 'Grade de l\'AB',
  ab_telephone: 'Téléphone de l\'AB',
  ab_email: 'Email de l\'AB',
  ab_arrete: 'Arrêté de nomination de l\'AB',
  sgr_nom: 'Nom complet du SGR',
  sgr_sexe: 'Sexe du SGR',
  sgr_grade: 'Grade du SGR',
  sgr_telephone: 'Téléphone du SGR',
  sgr_email: 'Email du SGR',
  sgr_arrete: 'Arrêté de nomination du SGR',
  total_enseignants: 'Nombre total d\'enseignants',
  pa: 'Professeurs Associés (PA)',
  p: 'Professeurs (P)',
  po: 'Professeurs Ordinaires (PO)',
  enseignants_femmes: 'Effectif d\'enseignants de sexe féminin',
  chefs_travaux: 'Chefs des travaux',
  assistants: 'Assistants',
  charges_pratiques_professionnelles: 'Chargés de pratiques professionnelles',
  personnel_scientifique_femmes: 'Effectif du personnel scientifique de sexe féminin',
  cadres_commandement: 'Cadres de commandement',
  cadres_collaboration: 'Cadres de collaboration',
  agents_execution: 'Agents d\'exécution',
  filieres: 'Filière organisée',
  accords_mobilite: 'Accords de mobilité internationale des étudiants',
  niveaux_etudes: 'Niveaux d\'études',
  autres_niveaux: 'Autres niveaux',
  effectif_licence_total: 'Effectif Licence (total)',
  effectif_master_total: 'Effectif Master (total)',
  effectif_doctorat_total: 'Effectif Doctorat (total)',
  nombre_etudiants_lmd: 'Étudiants LMD (total)',
  titre_propriete_propriete: 'Titre de propriété immobilière',
  nombre_residences_personnel: 'Nombre des résidences pour le personnel',
  nombre_residences_estudiantines: 'Nombre des résidences estudiantines',
  est_locataire: 'L\'établissement est locataire',
  biens_sans_titre_foncier: 'Propriétés sans titre foncier',
  responsable_patrimoine_nom: 'Responsable patrimoine — Nom',
  responsable_patrimoine_telephone: 'Téléphone du responsable patrimoine',
  responsable_patrimoine_email: 'Email du responsable patrimoine',
  marches_publics: 'Membre de la cellule marchés publics',
  marche_nom: 'Nom du membre',
  marche_telephone: 'Téléphone du membre',
  marche_email: 'Email du membre',
  soumissionnaire_nom: 'Nom complet',
  soumissionnaire_email: 'Adresse e-mail',
  soumissionnaire_telephone: 'Téléphone',
};

const COMITE_REQUIRED_FIELDS = [
  'recteur_nom', 'recteur_sexe', 'recteur_grade', 'recteur_telephone', 'recteur_email', 'recteur_arrete',
  'sga_nom', 'sga_sexe', 'sga_grade', 'sga_telephone', 'sga_email', 'sga_arrete',
  'ab_nom', 'ab_sexe', 'ab_grade', 'ab_telephone', 'ab_email', 'ab_arrete',
  'sgr_nom', 'sgr_sexe', 'sgr_grade', 'sgr_telephone', 'sgr_email', 'sgr_arrete',
];

const RESSOURCES_HUMAINES_REQUIRED_FIELDS = [
  'total_enseignants', 'pa', 'p', 'po', 'enseignants_femmes',
  'chefs_travaux', 'assistants', 'charges_pratiques_professionnelles', 'personnel_scientifique_femmes',
  'cadres_commandement', 'cadres_collaboration', 'agents_execution',
];

function requiredFieldMessage(field) {
  return `Le champ ${CREATE_FIELD_LABELS[field] || field} est obligatoire.`;
}

function invalidEmailMessage(field) {
  return `Le champ ${CREATE_FIELD_LABELS[field] || field} doit contenir une adresse e-mail valide.`;
}

function validateCreateForm(form) {
  const errors = {};
  const isPrivate = form.statut === 'prive';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.nom_etablissement.trim()) {
    errors.nom_etablissement = requiredFieldMessage('nom_etablissement');
  }
  if (!form.sigle_etablissement.trim()) {
    errors.sigle_etablissement = requiredFieldMessage('sigle_etablissement');
  }
  if (!form.statut.trim()) {
    errors.statut = requiredFieldMessage('statut');
  }
  if (!form.adresse.trim()) {
    errors.adresse = requiredFieldMessage('adresse');
  }
  if (!form.rue_avenue.trim()) {
    errors.rue_avenue = requiredFieldMessage('rue_avenue');
  }
  if (!form.commune.trim()) {
    errors.commune = requiredFieldMessage('commune');
  }
  if (!form.ville_localite.trim()) {
    errors.ville_localite = requiredFieldMessage('ville_localite');
  }
  if (!form.province.trim()) {
    errors.province = requiredFieldMessage('province');
  }
  if (!form.telephone.trim()) {
    errors.telephone = requiredFieldMessage('telephone');
  }
  if (!form.email.trim()) {
    errors.email = requiredFieldMessage('email');
  } else if (!emailRegex.test(form.email)) {
    errors.email = invalidEmailMessage('email');
  }
  if (!form.date_creation) {
    errors.date_creation = requiredFieldMessage('date_creation');
  }
  if (!form.acte_creation) {
    errors.acte_creation = requiredFieldMessage('acte_creation');
  }
  if (isPrivate && !form.acte_fonctionnement) {
    errors.acte_fonctionnement = requiredFieldMessage('acte_fonctionnement');
  }
  if (isPrivate && !form.acte_agrement) {
    errors.acte_agrement = requiredFieldMessage('acte_agrement');
  }
  if (isPrivate && !form.acte_prise_en_charge) {
    errors.acte_prise_en_charge = requiredFieldMessage('acte_prise_en_charge');
  }
  if (isPrivate && form.pris_en_charge_par_etat && !form.convention_etat_rdc) {
    errors.convention_etat_rdc = requiredFieldMessage('convention_etat_rdc');
  }

  COMITE_REQUIRED_FIELDS.forEach((field) => {
    const value = form[field];
    if (typeof File !== 'undefined' && value instanceof File) return;
    if (value == null || !String(value).trim()) errors[field] = requiredFieldMessage(field);
  });
  ['recteur_email', 'sga_email', 'ab_email', 'sgr_email'].forEach((field) => {
    if (form[field] && !emailRegex.test(form[field])) {
      errors[field] = invalidEmailMessage(field);
    }
  });
  RESSOURCES_HUMAINES_REQUIRED_FIELDS.forEach((field) => {
    if (form[field] === '' || form[field] == null) {
      errors[field] = requiredFieldMessage(field);
    }
  });
  if (!form.filieres.length) {
    errors.filieres = requiredFieldMessage('filieres');
  }
  if (!form.accords_mobilite.length) {
    errors.accords_mobilite = requiredFieldMessage('accords_mobilite');
  }
  if (!form.licence && !form.master && !form.doctorat) {
    errors.niveaux_etudes = requiredFieldMessage('niveaux_etudes');
  }
  ['autres_niveaux', 'effectif_licence_total', 'effectif_master_total', 'effectif_doctorat_total', 'nombre_etudiants_lmd'].forEach((field) => {
    if (form[field] === '' || form[field] == null) {
      errors[field] = requiredFieldMessage(field);
    }
  });
  if (!form.titre_propriete_propriete) {
    errors.titre_propriete_propriete = requiredFieldMessage('titre_propriete_propriete');
  }
  ['nombre_residences_personnel', 'nombre_residences_estudiantines'].forEach((field) => {
    if (form[field] === '' || form[field] == null) {
      errors[field] = requiredFieldMessage(field);
    }
  });
  if (form.est_locataire !== true && form.est_locataire !== false) {
    errors.est_locataire = requiredFieldMessage('est_locataire');
  }
  ['biens_sans_titre_foncier', 'responsable_patrimoine_nom', 'responsable_patrimoine_telephone', 'responsable_patrimoine_email'].forEach((field) => {
    if (!form[field].trim()) {
      errors[field] = requiredFieldMessage(field);
    }
  });
  if (form.responsable_patrimoine_email && !emailRegex.test(form.responsable_patrimoine_email)) {
    errors.responsable_patrimoine_email = invalidEmailMessage('responsable_patrimoine_email');
  }
  if (form.cellule_marches_publics) {
    if (!form.marches_publics.length) {
      errors.marches_publics = requiredFieldMessage('marches_publics');
    } else {
      const hasIncompleteMember = form.marches_publics.some((member) =>
        !member.nom?.trim() || !member.telephone?.trim() || !member.email?.trim()
      );
      const hasInvalidMemberEmail = form.marches_publics.some((member) =>
        member.email?.trim() && !emailRegex.test(member.email)
      );
      if (hasIncompleteMember) {
        errors.marches_publics = 'Tous les champs du membre de la cellule marchés publics sont obligatoires.';
      } else if (hasInvalidMemberEmail) {
        errors.marches_publics = 'Le champ Email du membre doit contenir une adresse e-mail valide.';
      }
    }
  }

  if (!form.soumissionnaire_nom.trim()) {
    errors.soumissionnaire_nom = requiredFieldMessage('soumissionnaire_nom');
  }
  if (!form.soumissionnaire_email.trim()) {
    errors.soumissionnaire_email = requiredFieldMessage('soumissionnaire_email');
  } else if (!emailRegex.test(form.soumissionnaire_email)) {
    errors.soumissionnaire_email = invalidEmailMessage('soumissionnaire_email');
  }
  if (!form.soumissionnaire_telephone.trim()) {
    errors.soumissionnaire_telephone = requiredFieldMessage('soumissionnaire_telephone');
  }

  return errors;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();

  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = raw;
    }
  }

  if (!response.ok) {
    // Erreurs de validation de champs (objet de tableaux)
    if (typeof data === 'object' && data !== null && !data.detail) {
      const fieldErrors = Object.entries(data)
        .map(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          return `${field} : ${msg}`;
        })
        .join('\n');
      const err = new Error(fieldErrors || 'Erreur de validation');
      err.fieldErrors = data;
      throw err;
    }
    const apiError =
      (typeof data === 'object' && data?.detail) ||
      (typeof data === 'string' ? data : 'Erreur API');
    throw new Error(apiError);
  }

  return data;
}

function buildListQuery(filters, page, pageSize) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  if (filters.statut) params.set('statut', filters.statut);
  if (filters.province && filters.province.trim()) params.set('province', filters.province.trim());
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());

  return params.toString();
}

function buildCreateJsonPayload(form) {
  return {
    nom_etablissement: form.nom_etablissement,
    sigle_etablissement: form.sigle_etablissement,
    statut: form.statut,
    etat: form.etat,
    pris_en_charge_par_etat: form.pris_en_charge_par_etat,
    adresse: form.adresse,
    rue_avenue: form.rue_avenue,
    commune: form.commune,
    ville_localite: form.ville_localite,
    province: form.province,
    telephone: form.telephone,
    email: form.email,
    latitude: form.latitude !== '' ? parseFloat(form.latitude) : null,
    longitude: form.longitude !== '' ? parseFloat(form.longitude) : null,
    date_creation: form.date_creation || null,
    recteur_nom: form.recteur_nom,
    recteur_sexe: form.recteur_sexe,
    recteur_grade: form.recteur_grade,
    recteur_telephone: form.recteur_telephone,
    recteur_email: form.recteur_email,
    recteur_en_fonction: form.recteur_en_fonction,
    recteur_hors_fonction_depuis: form.recteur_en_fonction ? null : (form.recteur_hors_fonction_depuis || null),
    recteur_hors_fonction_motif: form.recteur_en_fonction ? null : (form.recteur_hors_fonction_motif || null),
    sga_nom: form.sga_nom,
    sga_sexe: form.sga_sexe,
    sga_grade: form.sga_grade,
    sga_telephone: form.sga_telephone,
    sga_email: form.sga_email,
    sga_en_fonction: form.sga_en_fonction,
    sga_hors_fonction_depuis: form.sga_en_fonction ? null : (form.sga_hors_fonction_depuis || null),
    sga_hors_fonction_motif: form.sga_en_fonction ? null : (form.sga_hors_fonction_motif || null),
    ab_nom: form.ab_nom,
    ab_sexe: form.ab_sexe,
    ab_grade: form.ab_grade,
    ab_telephone: form.ab_telephone,
    ab_email: form.ab_email,
    ab_en_fonction: form.ab_en_fonction,
    ab_hors_fonction_depuis: form.ab_en_fonction ? null : (form.ab_hors_fonction_depuis || null),
    ab_hors_fonction_motif: form.ab_en_fonction ? null : (form.ab_hors_fonction_motif || null),
    sgr_nom: form.sgr_nom,
    sgr_sexe: form.sgr_sexe,
    sgr_grade: form.sgr_grade,
    sgr_telephone: form.sgr_telephone,
    sgr_email: form.sgr_email,
    sgr_en_fonction: form.sgr_en_fonction,
    sgr_hors_fonction_depuis: form.sgr_en_fonction ? null : (form.sgr_hors_fonction_depuis || null),
    sgr_hors_fonction_motif: form.sgr_en_fonction ? null : (form.sgr_hors_fonction_motif || null),
    total_enseignants: form.total_enseignants !== '' ? parseInt(form.total_enseignants, 10) : null,
    pa: form.pa !== '' ? parseInt(form.pa, 10) : null,
    p: form.p !== '' ? parseInt(form.p, 10) : null,
    po: form.po !== '' ? parseInt(form.po, 10) : null,
    enseignants_femmes: form.enseignants_femmes !== '' ? parseInt(form.enseignants_femmes, 10) : null,
    chefs_travaux: form.chefs_travaux !== '' ? parseInt(form.chefs_travaux, 10) : null,
    assistants: form.assistants !== '' ? parseInt(form.assistants, 10) : null,
    charges_pratiques_professionnelles: form.charges_pratiques_professionnelles !== '' ? parseInt(form.charges_pratiques_professionnelles, 10) : null,
    personnel_scientifique_femmes: form.personnel_scientifique_femmes !== '' ? parseInt(form.personnel_scientifique_femmes, 10) : null,
    cadres_commandement: form.cadres_commandement !== '' ? parseInt(form.cadres_commandement, 10) : null,
    cadres_collaboration: form.cadres_collaboration !== '' ? parseInt(form.cadres_collaboration, 10) : null,
    agents_execution: form.agents_execution !== '' ? parseInt(form.agents_execution, 10) : null,
    filieres: form.filieres,
    accords_mobilite: form.accords_mobilite,
    licence: form.licence,
    master: form.master,
    doctorat: form.doctorat,
    autres_niveaux: form.autres_niveaux,
    effectif_licence_total: form.effectif_licence_total !== '' ? parseInt(form.effectif_licence_total, 10) : null,
    effectif_master_total: form.effectif_master_total !== '' ? parseInt(form.effectif_master_total, 10) : null,
    effectif_doctorat_total: form.effectif_doctorat_total !== '' ? parseInt(form.effectif_doctorat_total, 10) : null,
    nombre_etudiants_lmd: form.nombre_etudiants_lmd !== '' ? parseInt(form.nombre_etudiants_lmd, 10) : null,
    nombre_residences_personnel: form.nombre_residences_personnel !== '' ? parseInt(form.nombre_residences_personnel, 10) : null,
    nombre_residences_estudiantines: form.nombre_residences_estudiantines !== '' ? parseInt(form.nombre_residences_estudiantines, 10) : null,
    est_locataire: form.est_locataire,
    biens_sans_titre_foncier: form.biens_sans_titre_foncier,
    responsable_patrimoine_nom: form.responsable_patrimoine_nom,
    responsable_patrimoine_telephone: form.responsable_patrimoine_telephone,
    responsable_patrimoine_email: form.responsable_patrimoine_email,
    organigramme_existe: form.organigramme_existe,
    audit_interne: form.audit_interne,
    date_dernier_controle_viabilite: form.date_dernier_controle_viabilite,
    date_dernier_controle_gestion: form.date_dernier_controle_gestion,
    date_dernier_controle_scolarite: form.date_dernier_controle_scolarite,
    ecole_doctorale: form.ecole_doctorale,
    cellule_marches_publics: form.cellule_marches_publics,
    marches_publics: form.marches_publics,
    description: form.description,
    soumissionnaire_nom: form.soumissionnaire_nom,
    soumissionnaire_email: form.soumissionnaire_email,
    soumissionnaire_telephone: form.soumissionnaire_telephone,
  };
}

function buildCreateMultipartPayload(form) {
  const formData = new FormData();
  formData.append('nom_etablissement', form.nom_etablissement);
  formData.append('sigle_etablissement', form.sigle_etablissement);
  formData.append('statut', form.statut);
  formData.append('etat', form.etat);
  formData.append('pris_en_charge_par_etat', String(form.pris_en_charge_par_etat));
  if (form.logo) formData.append('logo', form.logo, form.logo.name);
  if (form.acte_prise_en_charge) formData.append('acte_prise_en_charge', form.acte_prise_en_charge, form.acte_prise_en_charge.name);
  if (form.convention_etat_rdc) formData.append('convention_etat_rdc', form.convention_etat_rdc, form.convention_etat_rdc.name);
  formData.append('adresse', form.adresse);
  formData.append('rue_avenue', form.rue_avenue);
  formData.append('commune', form.commune);
  formData.append('ville_localite', form.ville_localite);
  formData.append('province', form.province);
  formData.append('telephone', form.telephone);
  formData.append('email', form.email);
  if (form.latitude !== '') formData.append('latitude', form.latitude);
  if (form.longitude !== '') formData.append('longitude', form.longitude);
  if (form.date_creation) formData.append('date_creation', form.date_creation);
  if (form.acte_creation) formData.append('acte_creation', form.acte_creation, form.acte_creation.name);
  if (form.acte_fonctionnement) formData.append('acte_fonctionnement', form.acte_fonctionnement, form.acte_fonctionnement.name);
  if (form.acte_agrement) formData.append('acte_agrement', form.acte_agrement, form.acte_agrement.name);
  formData.append('recteur_nom', form.recteur_nom);
  formData.append('recteur_sexe', form.recteur_sexe);
  formData.append('recteur_grade', form.recteur_grade);
  formData.append('recteur_telephone', form.recteur_telephone);
  formData.append('recteur_email', form.recteur_email);
  if (form.recteur_arrete) formData.append('recteur_arrete', form.recteur_arrete, form.recteur_arrete.name);
  formData.append('recteur_en_fonction', String(form.recteur_en_fonction));
  if (!form.recteur_en_fonction && form.recteur_hors_fonction_depuis) formData.append('recteur_hors_fonction_depuis', form.recteur_hors_fonction_depuis);
  if (!form.recteur_en_fonction && form.recteur_hors_fonction_motif) formData.append('recteur_hors_fonction_motif', form.recteur_hors_fonction_motif);
  formData.append('sga_nom', form.sga_nom);
  formData.append('sga_sexe', form.sga_sexe);
  formData.append('sga_grade', form.sga_grade);
  formData.append('sga_telephone', form.sga_telephone);
  formData.append('sga_email', form.sga_email);
  if (form.sga_arrete) formData.append('sga_arrete', form.sga_arrete, form.sga_arrete.name);
  formData.append('sga_en_fonction', String(form.sga_en_fonction));
  if (!form.sga_en_fonction && form.sga_hors_fonction_depuis) formData.append('sga_hors_fonction_depuis', form.sga_hors_fonction_depuis);
  if (!form.sga_en_fonction && form.sga_hors_fonction_motif) formData.append('sga_hors_fonction_motif', form.sga_hors_fonction_motif);
  formData.append('ab_nom', form.ab_nom);
  formData.append('ab_sexe', form.ab_sexe);
  formData.append('ab_grade', form.ab_grade);
  formData.append('ab_telephone', form.ab_telephone);
  formData.append('ab_email', form.ab_email);
  if (form.ab_arrete) formData.append('ab_arrete', form.ab_arrete, form.ab_arrete.name);
  formData.append('ab_en_fonction', String(form.ab_en_fonction));
  if (!form.ab_en_fonction && form.ab_hors_fonction_depuis) formData.append('ab_hors_fonction_depuis', form.ab_hors_fonction_depuis);
  if (!form.ab_en_fonction && form.ab_hors_fonction_motif) formData.append('ab_hors_fonction_motif', form.ab_hors_fonction_motif);
  formData.append('sgr_nom', form.sgr_nom);
  formData.append('sgr_sexe', form.sgr_sexe);
  formData.append('sgr_grade', form.sgr_grade);
  formData.append('sgr_telephone', form.sgr_telephone);
  formData.append('sgr_email', form.sgr_email);
  if (form.sgr_arrete) formData.append('sgr_arrete', form.sgr_arrete, form.sgr_arrete.name);
  formData.append('sgr_en_fonction', String(form.sgr_en_fonction));
  if (!form.sgr_en_fonction && form.sgr_hors_fonction_depuis) formData.append('sgr_hors_fonction_depuis', form.sgr_hors_fonction_depuis);
  if (!form.sgr_en_fonction && form.sgr_hors_fonction_motif) formData.append('sgr_hors_fonction_motif', form.sgr_hors_fonction_motif);
  if (form.total_enseignants !== '') formData.append('total_enseignants', form.total_enseignants);
  if (form.pa !== '') formData.append('pa', form.pa);
  if (form.p !== '') formData.append('p', form.p);
  if (form.po !== '') formData.append('po', form.po);
  if (form.enseignants_femmes !== '') formData.append('enseignants_femmes', form.enseignants_femmes);
  if (form.chefs_travaux !== '') formData.append('chefs_travaux', form.chefs_travaux);
  if (form.assistants !== '') formData.append('assistants', form.assistants);
  if (form.charges_pratiques_professionnelles !== '') formData.append('charges_pratiques_professionnelles', form.charges_pratiques_professionnelles);
  if (form.personnel_scientifique_femmes !== '') formData.append('personnel_scientifique_femmes', form.personnel_scientifique_femmes);
  if (form.cadres_commandement !== '') formData.append('cadres_commandement', form.cadres_commandement);
  if (form.cadres_collaboration !== '') formData.append('cadres_collaboration', form.cadres_collaboration);
  if (form.agents_execution !== '') formData.append('agents_execution', form.agents_execution);
  if (form.filieres.length) formData.append('filieres', JSON.stringify(form.filieres));
  if (form.accords_mobilite.length) formData.append('accords_mobilite', JSON.stringify(form.accords_mobilite));
  formData.append('licence', String(form.licence));
  formData.append('master', String(form.master));
  formData.append('doctorat', String(form.doctorat));
  formData.append('autres_niveaux', form.autres_niveaux);
  if (form.effectif_licence_total !== '') formData.append('effectif_licence_total', form.effectif_licence_total);
  if (form.effectif_master_total !== '') formData.append('effectif_master_total', form.effectif_master_total);
  if (form.effectif_doctorat_total !== '') formData.append('effectif_doctorat_total', form.effectif_doctorat_total);
  if (form.nombre_etudiants_lmd !== '') formData.append('nombre_etudiants_lmd', form.nombre_etudiants_lmd);
  if (form.titre_propriete_propriete) formData.append('titre_propriete_propriete', form.titre_propriete_propriete, form.titre_propriete_propriete.name);
  if (form.nombre_residences_personnel !== '') formData.append('nombre_residences_personnel', form.nombre_residences_personnel);
  if (form.nombre_residences_estudiantines !== '') formData.append('nombre_residences_estudiantines', form.nombre_residences_estudiantines);
  formData.append('est_locataire', String(form.est_locataire));
  formData.append('biens_sans_titre_foncier', form.biens_sans_titre_foncier);
  formData.append('responsable_patrimoine_nom', form.responsable_patrimoine_nom);
  formData.append('responsable_patrimoine_telephone', form.responsable_patrimoine_telephone);
  formData.append('responsable_patrimoine_email', form.responsable_patrimoine_email);
  formData.append('organigramme_existe', String(form.organigramme_existe));
  if (form.organigramme_fichier) formData.append('organigramme_fichier', form.organigramme_fichier, form.organigramme_fichier.name);
  formData.append('audit_interne', String(form.audit_interne));
  if (form.date_dernier_controle_viabilite) formData.append('date_dernier_controle_viabilite', form.date_dernier_controle_viabilite);
  if (form.date_dernier_controle_gestion) formData.append('date_dernier_controle_gestion', form.date_dernier_controle_gestion);
  if (form.date_dernier_controle_scolarite) formData.append('date_dernier_controle_scolarite', form.date_dernier_controle_scolarite);
  formData.append('ecole_doctorale', String(form.ecole_doctorale));
  if (form.acte_ecole_doctorale) formData.append('acte_ecole_doctorale', form.acte_ecole_doctorale, form.acte_ecole_doctorale.name);
  formData.append('cellule_marches_publics', String(form.cellule_marches_publics));
  if (form.marches_publics.length) formData.append('marches_publics', JSON.stringify(form.marches_publics));
  formData.append('description', form.description);
  formData.append('soumissionnaire_nom', form.soumissionnaire_nom);
  formData.append('soumissionnaire_email', form.soumissionnaire_email);
  formData.append('soumissionnaire_telephone', form.soumissionnaire_telephone);

  return formData;
}

function mapToUpdateForm(item) {
  return {
    id: item.id,
    nom_etablissement: item.nom_etablissement || '',
    sigle_etablissement: item.sigle_etablissement || '',
    statut: item.statut || 'public',
    etat: item.etat || 'soumis',
    pris_en_charge_par_etat: Boolean(item.pris_en_charge_par_etat),
    adresse: item.adresse || '',
    rue_avenue: item.rue_avenue || '',
    commune: item.commune || '',
    ville_localite: item.ville_localite || '',
    province: item.province || '',
    telephone: item.telephone || '',
    email: item.email || '',
    latitude: item.latitude != null ? String(item.latitude) : '',
    longitude: item.longitude != null ? String(item.longitude) : '',
    date_creation: item.date_creation || '',
    recteur_nom: item.recteur_nom || '',
    recteur_sexe: item.recteur_sexe || '',
    recteur_grade: item.recteur_grade || '',
    recteur_telephone: item.recteur_telephone || '',
    recteur_email: item.recteur_email || '',
    recteur_en_fonction: item.recteur_en_fonction != null ? Boolean(item.recteur_en_fonction) : true,
    recteur_hors_fonction_depuis: item.recteur_hors_fonction_depuis || '',
    recteur_hors_fonction_motif: item.recteur_hors_fonction_motif || '',
    sga_nom: item.sga_nom || '',
    sga_sexe: item.sga_sexe || '',
    sga_grade: item.sga_grade || '',
    sga_telephone: item.sga_telephone || '',
    sga_email: item.sga_email || '',
    sga_en_fonction: item.sga_en_fonction != null ? Boolean(item.sga_en_fonction) : true,
    sga_hors_fonction_depuis: item.sga_hors_fonction_depuis || '',
    sga_hors_fonction_motif: item.sga_hors_fonction_motif || '',
    ab_nom: item.ab_nom || '',
    ab_sexe: item.ab_sexe || '',
    ab_grade: item.ab_grade || '',
    ab_telephone: item.ab_telephone || '',
    ab_email: item.ab_email || '',
    ab_en_fonction: item.ab_en_fonction != null ? Boolean(item.ab_en_fonction) : true,
    ab_hors_fonction_depuis: item.ab_hors_fonction_depuis || '',
    ab_hors_fonction_motif: item.ab_hors_fonction_motif || '',
    sgr_nom: item.sgr_nom || '',
    sgr_sexe: item.sgr_sexe || '',
    sgr_grade: item.sgr_grade || '',
    sgr_telephone: item.sgr_telephone || '',
    sgr_email: item.sgr_email || '',
    sgr_en_fonction: item.sgr_en_fonction != null ? Boolean(item.sgr_en_fonction) : true,
    sgr_hors_fonction_depuis: item.sgr_hors_fonction_depuis || '',
    sgr_hors_fonction_motif: item.sgr_hors_fonction_motif || '',
    total_enseignants: item.total_enseignants != null ? String(item.total_enseignants) : '',
    pa: item.pa != null ? String(item.pa) : '',
    p: item.p != null ? String(item.p) : '',
    po: item.po != null ? String(item.po) : '',
    enseignants_femmes: item.enseignants_femmes != null ? String(item.enseignants_femmes) : '',
    chefs_travaux: item.chefs_travaux != null ? String(item.chefs_travaux) : '',
    assistants: item.assistants != null ? String(item.assistants) : '',
    charges_pratiques_professionnelles: item.charges_pratiques_professionnelles != null ? String(item.charges_pratiques_professionnelles) : '',
    personnel_scientifique_femmes: item.personnel_scientifique_femmes != null ? String(item.personnel_scientifique_femmes) : '',
    cadres_commandement: item.cadres_commandement != null ? String(item.cadres_commandement) : '',
    cadres_collaboration: item.cadres_collaboration != null ? String(item.cadres_collaboration) : '',
    agents_execution: item.agents_execution != null ? String(item.agents_execution) : '',
    filieres: Array.isArray(item.filieres)
      ? item.filieres.map((f) => ({
          nom: f.nom || f.name || String(f),
          effectifs: Array.isArray(f.effectifs) ? f.effectifs.map((e) => ({
            annee: e.annee != null ? String(e.annee) : '',
            total: e.total != null ? String(e.total) : '',
            masculin: e.masculin != null ? String(e.masculin) : '',
            feminin: e.feminin != null ? String(e.feminin) : '',
          })) : [],
        }))
      : [],
    licence: Boolean(item.licence),
    master: Boolean(item.master),
    doctorat: Boolean(item.doctorat),
    autres_niveaux: item.autres_niveaux || '',
    effectif_licence_total: item.effectif_licence_total != null ? String(item.effectif_licence_total) : '',
    effectif_master_total: item.effectif_master_total != null ? String(item.effectif_master_total) : '',
    effectif_doctorat_total: item.effectif_doctorat_total != null ? String(item.effectif_doctorat_total) : '',
    nombre_etudiants_lmd: item.nombre_etudiants_lmd != null ? String(item.nombre_etudiants_lmd) : '',
    titre_propriete_propriete: item.titre_propriete_propriete || null,
    nombre_residences_personnel: item.nombre_residences_personnel != null ? String(item.nombre_residences_personnel) : '',
    nombre_residences_estudiantines: item.nombre_residences_estudiantines != null ? String(item.nombre_residences_estudiantines) : '',
    est_locataire: Boolean(item.est_locataire),
    biens_sans_titre_foncier: item.biens_sans_titre_foncier || '',
    responsable_patrimoine_nom: item.responsable_patrimoine_nom || '',
    responsable_patrimoine_telephone: item.responsable_patrimoine_telephone || '',
    responsable_patrimoine_email: item.responsable_patrimoine_email || '',
    organigramme_existe: Boolean(item.organigramme_existe),
    audit_interne: Boolean(item.audit_interne),
    date_dernier_controle_viabilite: item.date_dernier_controle_viabilite || '',
    date_dernier_controle_gestion: item.date_dernier_controle_gestion || '',
    date_dernier_controle_scolarite: item.date_dernier_controle_scolarite || '',
    ecole_doctorale: Boolean(item.ecole_doctorale),
    cellule_marches_publics: Boolean(item.cellule_marches_publics),
    marches_publics: Array.isArray(item.marches_publics)
      ? item.marches_publics.map((m) => ({ nom: m.nom || '', telephone: m.telephone || '', email: m.email || '' }))
      : [],
    accords_mobilite: Array.isArray(item.accords_mobilite)
      ? item.accords_mobilite.map((a) => ({ accord: a.accord || '' }))
      : [],
    description: item.description || '',
    soumissionnaire_nom: item.soumissionnaire_nom || '',
    soumissionnaire_email: item.soumissionnaire_email || '',
    soumissionnaire_telephone: item.soumissionnaire_telephone || '',
  };
}

function buildPatchJsonPayload(current, original) {
  const payload = {};
  const fields = [
    'nom_etablissement',
    'sigle_etablissement',
    'statut',
    'etat',
    'pris_en_charge_par_etat',
    'adresse',
    'rue_avenue',
    'commune',
    'ville_localite',
    'province',
    'telephone',
    'email',
    'latitude',
    'longitude',
    'date_creation',
    'recteur_nom', 'recteur_sexe', 'recteur_grade', 'recteur_telephone', 'recteur_email',
    'recteur_en_fonction', 'recteur_hors_fonction_depuis', 'recteur_hors_fonction_motif',
    'sga_nom', 'sga_sexe', 'sga_grade', 'sga_telephone', 'sga_email',
    'sga_en_fonction', 'sga_hors_fonction_depuis', 'sga_hors_fonction_motif',
    'ab_nom', 'ab_sexe', 'ab_grade', 'ab_telephone', 'ab_email',
    'ab_en_fonction', 'ab_hors_fonction_depuis', 'ab_hors_fonction_motif',
    'sgr_nom', 'sgr_sexe', 'sgr_grade', 'sgr_telephone', 'sgr_email',
    'sgr_en_fonction', 'sgr_hors_fonction_depuis', 'sgr_hors_fonction_motif',
    'total_enseignants', 'pa', 'p', 'po', 'enseignants_femmes',
    'chefs_travaux', 'assistants', 'charges_pratiques_professionnelles',
    'personnel_scientifique_femmes',
    'cadres_commandement', 'cadres_collaboration', 'agents_execution',
    'autres_niveaux',
    'licence', 'master', 'doctorat',
    'effectif_licence_total', 'effectif_master_total', 'effectif_doctorat_total', 'nombre_etudiants_lmd',
    'nombre_residences_personnel', 'nombre_residences_estudiantines',
    'est_locataire', 'biens_sans_titre_foncier',
    'responsable_patrimoine_nom', 'responsable_patrimoine_telephone', 'responsable_patrimoine_email',
    'organigramme_existe', 'audit_interne',
    'date_dernier_controle_viabilite', 'date_dernier_controle_gestion', 'date_dernier_controle_scolarite',
    'ecole_doctorale', 'cellule_marches_publics',
    'description',
    'soumissionnaire_nom',
    'soumissionnaire_email',
    'soumissionnaire_telephone',
  ];

  const boolFields = new Set([
    'pris_en_charge_par_etat','est_locataire','organigramme_existe','audit_interne',
    'ecole_doctorale','cellule_marches_publics',
    'recteur_en_fonction','sga_en_fonction','ab_en_fonction','sgr_en_fonction',
    'licence','master','doctorat',
  ]);

  fields.forEach((field) => {
    if (boolFields.has(field)) {
      if (current[field] !== original[field]) payload[field] = current[field];
    } else if ((current[field] || '') !== (original[field] || '')) {
      payload[field] = current[field];
    }
  });

  if (JSON.stringify(current.marches_publics) !== JSON.stringify(original.marches_publics)) {
    payload.marches_publics = current.marches_publics;
  }

  if (JSON.stringify(current.filieres) !== JSON.stringify(original.filieres)) {
    payload.filieres = current.filieres;
  }

  if (JSON.stringify(current.accords_mobilite) !== JSON.stringify(original.accords_mobilite)) {
    payload.accords_mobilite = current.accords_mobilite;
  }

  return payload;
}

// Fetch and render DRC border from public GeoJSON
const DRC_PROVINCES = [
  'Kinshasa','Kongo Central','Kwango','Kwilu','Mai-Ndombe',
  'Kasaï','Kasaï-Central','Kasaï-Oriental','Lomami','Sankuru',
  'Maniema','Nord-Kivu','Sud-Kivu','Ituri','Haut-Uele','Bas-Uele',
  'Tshopo','Nord-Ubangi','Mongala','Sud-Ubangi','Équateur','Tshuapa',
  'Tanganyika','Haut-Lomami','Lualaba','Haut-Katanga',
];

function ProvinceDropdown({ value, onChange, active, required, placeholder: ph }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const divRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (divRef.current && !divRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = DRC_PROVINCES.filter((p) =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  function select(province) {
    onChange(province);
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange('');
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="prov-dropdown" ref={divRef}>
      <div
        className={`prov-trigger${open ? ' prov-trigger-open' : ''}${active ? ' prov-trigger-active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? 'prov-value' : 'prov-placeholder'}>
          {value || ph || 'Toutes les provinces'}
        </span>
        <span className="prov-arrow">{open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div className="prov-menu">
          <div className="prov-search-wrap">
            <input
              autoFocus
              className="prov-search"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="prov-list">
            {!required && <li className="prov-item prov-clear" onMouseDown={() => clear()}>— Toutes les provinces</li>}
            {filtered.length === 0 && <li className="prov-item prov-none">Aucun résultat</li>}
            {filtered.map((p) => (
              <li
                key={p}
                className={`prov-item${value === p ? ' prov-item-active' : ''}`}
                onMouseDown={() => select(p)}
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Fit map to DRC bounds on mount
function FitDRC() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[-13.5, 12.2], [5.3, 31.3]], { padding: [24, 24] });
  }, [map]);
  return null;
}

// Reset map to DRC bounds on demand
function ResetMap({ tick }) {
  const map = useMap();
  useEffect(() => {
    if (tick > 0) map.flyToBounds([[-13.5, 12.2], [5.3, 31.3]], { padding: [24, 24], duration: 1 });
  }, [map, tick]);
  return null;
}

// Fly to a specific location
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 12, { duration: 1.2 });
  }, [map, target]);
  return null;
}

function MapView({ etablissements, allEtablissements, onIdentify, filters, setFilters, page, setPage, totalPages, totalCount, loadingList, onCreateClick }) {
  // DRC center
  const center = [-4.0383, 21.7587];
  const [flyTarget, setFlyTarget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [resetTick, setResetTick] = useState(0);

  const hasActiveFilters = filters.statut || filters.province || filters.search;

  const allMarkers = (allEtablissements || etablissements).filter(
    (item) =>
      item.latitude != null &&
      item.longitude != null &&
      !isNaN(parseFloat(item.latitude)) &&
      !isNaN(parseFloat(item.longitude))
  );

  // All items are already API-filtered; no extra client filtering needed
  const markers = allMarkers;

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleSidebarClick(item) {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    setFlyTarget([lat, lng]);
    setActiveId(item.id);
  }

  return (
    <div className="map-fullscreen">
      <MapContainer center={center} zoom={5} className="leaflet-map" zoomControl={false} attributionControl={false}>
        <FitDRC />
        <FlyTo target={flyTarget} />
        <ResetMap tick={resetTick} />
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((item) => (
          <Marker
            key={item.id}
            position={[parseFloat(item.latitude), parseFloat(item.longitude)]}
            icon={L.divIcon({
              className: '',
              html: `<span class="pulse-marker ${item.statut === 'prive' ? 'pulse-marker-prive' : 'pulse-marker-public'}"><span class="pulse-ring"></span></span>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
              popupAnchor: [0, -10],
            })}
          >
            <Popup minWidth={200} className="custom-popup">
              <div className="popup-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="popup-icon"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
                <span className="popup-sigle">{item.sigle || item.sigle_etablissement || '—'}</span>
              </div>
              <div className="popup-body">
                <strong className="popup-nom">{toTitleCase(item.nom || item.nom_etablissement)}</strong>
                {(item.province || item.statut) && (
                  <div className="popup-meta">
                    {item.province && <span>{item.province}</span>}
                    {item.province && item.statut && <span className="popup-sep">·</span>}
                    {item.statut && <span>{item.statut}</span>}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Drawer FAB — visible only when drawer is closed */}
      {!drawerOpen && (
        <button
          className="drawer-fab"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir la liste des établissements"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {/* Backdrop — mobile only */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer */}
      <aside className={`map-sidebar${drawerOpen ? ' map-sidebar-open' : ''}`} aria-label="Liste des établissements">
        <div className="map-sidebar-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
          <span>Établissements</span>
          <span className="map-sidebar-count">{totalCount}</span>
          <button
            className="map-sidebar-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fermer le panneau"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="map-sidebar-filters">
          <div className="map-sidebar-search-wrap">
            <svg className="map-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="map-sidebar-search"
              type="text"
              placeholder="Rechercher nom, sigle..."
              value={filters.search || ''}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            />
            {filters.search && (
              <button className="map-search-clear" onClick={() => { setFilters((f) => ({ ...f, search: '' })); setPage(1); }}>×</button>
            )}
          </div>
          <select
            className={`map-sidebar-select${filters.statut ? ' filter-active' : ''}`}
            value={filters.statut}
            onChange={(e) => { setFilters((f) => ({ ...f, statut: e.target.value })); setPage(1); }}
          >
            <option value="">Tous les statuts</option>
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
          <ProvinceDropdown
            value={filters.province}
            onChange={(v) => { setFilters((f) => ({ ...f, province: v })); setPage(1); }}
            active={!!filters.province}
          />
          {hasActiveFilters && (
            <button
              className="map-sidebar-reset"
              onClick={() => { setFilters({ statut: '', province: '', search: '' }); setPage(1); }}
            >
              × Réinitialiser les filtres
            </button>
          )}
        </div>

        <ul className="map-sidebar-list">
          {loadingList && <li className="map-sidebar-empty">Chargement...</li>}
          {!loadingList && markers.length === 0 && (
            <li className="map-sidebar-empty">Aucun résultat trouvé.</li>
          )}
          {!loadingList && markers.map((item) => (
            <li
              key={item.id}
              className={`map-sidebar-item${activeId === item.id ? ' map-sidebar-item-active' : ''}`}
              onClick={() => handleSidebarClick(item)}
            >
              <div className="map-sidebar-avatar">
                {item.logo
                  ? <img src={`${API_BASE_URL.replace(/\/$/, '')}${item.logo}`} alt="" className="map-sidebar-logo" />
                  : <span className="map-sidebar-initials">{(item.sigle || item.sigle_etablissement || item.nom || item.nom_etablissement || '?')[0].toUpperCase()}</span>
                }
              </div>
              <div className="map-sidebar-info">
                <span className="map-sidebar-sigle">{item.sigle || item.sigle_etablissement || '—'}</span>
                <span className="map-sidebar-nom">{toTitleCase(item.nom || item.nom_etablissement)}</span>
                {item.province && <span className="map-sidebar-province">{item.province}</span>}
              </div>
            </li>
          ))}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="map-sidebar-pagination">
            <button
              className="map-sidebar-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            <span className="map-sidebar-page-info">{page} / {totalPages}</span>
            <button
              className="map-sidebar-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        )}

        {/* CTA Identifier */}
       
      </aside>

      {/* Reset map button */}
      <button
        className="map-reset-btn"
        onClick={() => setResetTick((t) => t + 1)}
        title="Recentrer la carte sur la RDC"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Recadrer
      </button>

      {markers.length === 0 && (
        <div className="map-overlay-msg">
          Aucun établissement avec coordonnées GPS. Ajoutez latitude/longitude lors de la création.
        </div>
      )}
    </div>
  );
}

function App() {
  const [view, setView] = useState('map');
  const [createStep, setCreateStep] = useState(1);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allEtablissements, setAllEtablissements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [filters, setFilters] = useState({ statut: '', province: '', search: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const filteredAll = useMemo(() => {
    let list = allEtablissements;
    if (filters.statut) list = list.filter((e) => e.statut === filters.statut);
    if (filters.province) list = list.filter((e) => e.province === filters.province);
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((e) =>
        e.nom_etablissement.toLowerCase().includes(q) ||
        e.sigle_etablissement.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      (a.nom_etablissement || '').localeCompare(b.nom_etablissement || '', 'fr', { sensitivity: 'base' })
    );
  }, [allEtablissements, filters]);

  const totalCount = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const etablissements = filteredAll.slice((page - 1) * pageSize, page * pageSize);

  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const isPrivateCreate = createForm.statut === 'prive';
  const [marcheForm, setMarcheForm] = useState({ nom: '', telephone: '', email: '' });
  const [filiereForm, setFiliereForm] = useState({ nom: '', effectifs: [] });
  const [effectifDraftForm, setEffectifDraftForm] = useState({ annee: '', total: '', masculin: '', feminin: '' });
  const [accordDraft, setAccordDraft] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [detectingGeo, setDetectingGeo] = useState(false);

  const [lookupCode, setLookupCode] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState(null);
  const [originalUpdateForm, setOriginalUpdateForm] = useState(null);
  const latInputRef = useRef(null);
  const msgTimerRef = useRef(null);

  // ── Détail établissement ──
  const [showDetailCodeModal, setShowDetailCodeModal] = useState(false);
  const [detailCodeInput, setDetailCodeInput] = useState('');
  const [detailCodeError, setDetailCodeError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailEtab, setDetailEtab] = useState(null);
  const [geoBlocked, setGeoBlocked] = useState(false);

  // ── Édition en ligne depuis le détail ──
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailEditForm, setDetailEditForm] = useState(null);
  const [detailEditOriginal, setDetailEditOriginal] = useState(null);
  const [detailEditFiles, setDetailEditFiles] = useState({});
  const [savingDetail, setSavingDetail] = useState(false);

  function showMessage(type, text) {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setMessage({ type, text });
    msgTimerRef.current = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  }

  const fetchEtablissements = useCallback(async () => {
    setLoadingList(true);
    try {
      const url = `${buildUrl(API_PATHS.list)}?page_size=9999`;
      const data = await apiRequest(url);

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      const normalized = rows.map(normalizeEtablissement);
      setAllEtablissements(normalized);

      if (normalized.length && !selectedId) {
        setSelectedId(normalized[0].id);
      }
    } catch (error) {
      setAllEtablissements([]);
      showMessage('error', `Erreur de chargement: ${error.message}`);
    } finally {
      setLoadingList(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchEtablissements();
  }, [fetchEtablissements]);

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters({ statut: '', province: '', search: '' });
    setPage(1);
  }

  function handleCreateChange(field, value) {
    setCreateForm((prev) => {
      if (field === 'statut' && value !== 'prive') {
        return {
          ...prev,
          statut: value,
          pris_en_charge_par_etat: false,
          acte_prise_en_charge: null,
          convention_etat_rdc: null,
          acte_fonctionnement: null,
          acte_agrement: null,
        };
      }
      if (field === 'cellule_marches_publics' && value === false) {
        return { ...prev, cellule_marches_publics: false, marches_publics: [] };
      }

      return { ...prev, [field]: value };
    });
    setFormErrors((prev) => {
      if (field === 'statut') {
        return {
          ...prev,
          statut: '',
          pris_en_charge_par_etat: '',
          acte_prise_en_charge: '',
          convention_etat_rdc: '',
          acte_fonctionnement: '',
          acte_agrement: '',
        };
      }
      if (field === 'pris_en_charge_par_etat' && value === false) {
        return {
          ...prev,
          pris_en_charge_par_etat: '',
          convention_etat_rdc: '',
        };
      }
      if (field.endsWith('_en_fonction') && value === true) {
        const prefix = field.replace('_en_fonction', '');
        return {
          ...prev,
          [field]: '',
          [`${prefix}_hors_fonction_depuis`]: '',
          [`${prefix}_hors_fonction_motif`]: '',
        };
      }
      if (['licence', 'master', 'doctorat'].includes(field)) {
        return { ...prev, [field]: '', niveaux_etudes: '' };
      }
      if (field === 'cellule_marches_publics') {
        return {
          ...prev,
          cellule_marches_publics: '',
          marches_publics: '',
          marche_nom: '',
          marche_telephone: '',
          marche_email: '',
        };
      }

      return { ...prev, [field]: '' };
    });
  }

  function handleMarcheFormChange(field, value) {
    const errorField = `marche_${field}`;
    setMarcheForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [errorField]: '', marches_publics: '' }));
  }

  function validateCreateProgress(targetStep) {
    const allErrors = validateCreateForm(createForm);
    const blockingErrors = Object.entries(allErrors).filter(
      ([field]) => (CREATE_FIELD_STEPS[field] || 1) < targetStep
    );
    const progressErrors = Object.fromEntries(blockingErrors);
    setFormErrors((prev) => ({ ...prev, ...progressErrors }));

    if (blockingErrors.length > 0) {
      const [firstInvalidField, firstError] = blockingErrors[0];
      const firstInvalidStep = CREATE_FIELD_STEPS[firstInvalidField] || 1;
      setCreateStep(firstInvalidStep);
      showMessage('error', firstError);
      return false;
    }

    return true;
  }

  function goToCreateStep(targetStep) {
    if (targetStep > createStep && !validateCreateProgress(targetStep)) return;
    setCreateStep(targetStep);
  }

  function goToNextCreateStep() {
    const nextStep = Math.min(createStep + 1, CREATE_STEPS[CREATE_STEPS.length - 1].num);
    if (!validateCreateProgress(nextStep)) return;
    setCreateStep(nextStep);
  }

  function addMembreMarche() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = {};
    if (!marcheForm.nom.trim()) errors.marche_nom = requiredFieldMessage('marche_nom');
    if (!marcheForm.telephone.trim()) errors.marche_telephone = requiredFieldMessage('marche_telephone');
    if (!marcheForm.email.trim()) {
      errors.marche_email = requiredFieldMessage('marche_email');
    } else if (!emailRegex.test(marcheForm.email)) {
      errors.marche_email = invalidEmailMessage('marche_email');
    }
    if (Object.keys(errors).length) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      showMessage('error', Object.values(errors)[0]);
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      marches_publics: [...prev.marches_publics, {
        nom: marcheForm.nom.trim(),
        telephone: marcheForm.telephone.trim(),
        email: marcheForm.email.trim(),
      }],
    }));
    setFormErrors((prev) => ({
      ...prev,
      marches_publics: '',
      marche_nom: '',
      marche_telephone: '',
      marche_email: '',
    }));
    setMarcheForm({ nom: '', telephone: '', email: '' });
  }

  function removeMembreMarche(index) {
    setCreateForm((prev) => ({
      ...prev,
      marches_publics: prev.marches_publics.filter((_, i) => i !== index),
    }));
  }

  function addEffectifToDraft() {
    const { annee, total, masculin, feminin } = effectifDraftForm;
    if (!annee) return;
    setFiliereForm((prev) => ({
      ...prev,
      effectifs: [...prev.effectifs, { annee, total, masculin, feminin }],
    }));
    setEffectifDraftForm({ annee: '', total: '', masculin: '', feminin: '' });
  }

  function removeEffectifFromDraft(index) {
    setFiliereForm((prev) => ({
      ...prev,
      effectifs: prev.effectifs.filter((_, i) => i !== index),
    }));
  }

  function addFiliere() {
    const nom = filiereForm.nom.trim();
    if (!nom) return;
    setCreateForm((prev) => ({
      ...prev,
      filieres: [...prev.filieres, { nom, effectifs: filiereForm.effectifs }],
    }));
    setFormErrors((prev) => ({ ...prev, filieres: '' }));
    setFiliereForm({ nom: '', effectifs: [] });
    setEffectifDraftForm({ annee: '', total: '', masculin: '', feminin: '' });
  }

  function removeFiliere(index) {
    setCreateForm((prev) => ({
      ...prev,
      filieres: prev.filieres.filter((_, i) => i !== index),
    }));
  }

  function addAccordMobilite() {
    const val = accordDraft.trim();
    if (!val) return;
    setCreateForm((prev) => ({
      ...prev,
      accords_mobilite: [...prev.accords_mobilite, { accord: val }],
    }));
    setFormErrors((prev) => ({ ...prev, accords_mobilite: '' }));
    setAccordDraft('');
  }

  function removeAccordMobilite(index) {
    setCreateForm((prev) => ({
      ...prev,
      accords_mobilite: prev.accords_mobilite.filter((_, i) => i !== index),
    }));
  }


  async function loadForUpdateByCode() {
    const code = lookupCode.trim();
    if (!code) {
      showMessage('error', 'Saisissez un code_etablissement pour la recherche.');
      return;
    }

    setLoadingUpdate(true);
    try {
      const query = new URLSearchParams({
        code_etablissement: code,
        page: '1',
        page_size: '1',
      }).toString();
      const url = `${buildUrl(API_PATHS.list)}?${query}`;
      const data = await apiRequest(url);

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      if (!rows.length) {
        throw new Error('Aucun etablissement trouve pour ce code_etablissement.');
      }

      const entity = normalizeEtablissement(rows[0]);
      const mapped = mapToUpdateForm(entity);
      setUpdateForm(mapped);
      setOriginalUpdateForm(mapped);
      setSelectedId(entity.id);
      showMessage('success', `Etablissement charge: ${entity.code_etablissement}`);
    } catch (error) {
      showMessage('error', `Chargement impossible: ${error.message}`);
    } finally {
      setLoadingUpdate(false);
    }
  }

  function handleUpdateChange(field, value) {
    setUpdateForm((prev) => ({ ...prev, [field]: value }));
  }

  function loadDetail(code) {
    const c = (code || detailCodeInput).trim();
    if (!c) {
      setDetailCodeError('Veuillez saisir le code de l\'établissement.');
      return;
    }
    setDetailCodeError('');
    const found = allEtablissements.find(
      (e) => (e.code_etablissement || '').trim().toLowerCase() === c.toLowerCase()
    );
    if (!found) {
      setDetailCodeError('Aucun établissement trouvé pour ce code. Vérifiez et réessayez.');
      return;
    }
    setDetailEtab(found);
    setShowDetailCodeModal(false);
    setDetailCodeInput('');
    setView('detail');
  }

  function openDetailEdit() {
    const mapped = mapToUpdateForm(detailEtab);
    setDetailEditForm(mapped);
    setDetailEditOriginal(mapped);
    setDetailEditFiles({});
    setDetailEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDetailEditFileChange(field, file) {
    setDetailEditFiles((prev) => ({ ...prev, [field]: file || null }));
  }

  function handleDetailEditChange(field, value) {
    setDetailEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDetailEditMarcheChange(idx, field, value) {
    setDetailEditForm((prev) => {
      const updated = prev.marches_publics.map((m, i) => i === idx ? { ...m, [field]: value } : m);
      return { ...prev, marches_publics: updated };
    });
  }

  function addDetailEditMarche() {
    setDetailEditForm((prev) => ({
      ...prev,
      marches_publics: [...prev.marches_publics, { nom: '', telephone: '', email: '' }],
    }));
  }

  function removeDetailEditMarche(idx) {
    setDetailEditForm((prev) => ({
      ...prev,
      marches_publics: prev.marches_publics.filter((_, i) => i !== idx),
    }));
  }

  function handleDetailEditFiliereChange(idx, field, value) {
    setDetailEditForm((prev) => {
      const updated = prev.filieres.map((f, i) => i === idx ? { ...f, [field]: value } : f);
      return { ...prev, filieres: updated };
    });
  }

  function addDetailEditFiliere() {
    setDetailEditForm((prev) => ({
      ...prev,
      filieres: [...prev.filieres, { nom: '', effectifs: [] }],
    }));
  }

  function removeDetailEditFiliere(idx) {
    setDetailEditForm((prev) => ({
      ...prev,
      filieres: prev.filieres.filter((_, i) => i !== idx),
    }));
  }

  function handleDetailEditAccordChange(idx, value) {
    setDetailEditForm((prev) => ({
      ...prev,
      accords_mobilite: prev.accords_mobilite.map((a, i) => i === idx ? { accord: value } : a),
    }));
  }

  function addDetailEditAccord() {
    setDetailEditForm((prev) => ({
      ...prev,
      accords_mobilite: [...prev.accords_mobilite, { accord: '' }],
    }));
  }

  function removeDetailEditAccord(idx) {
    setDetailEditForm((prev) => ({
      ...prev,
      accords_mobilite: prev.accords_mobilite.filter((_, i) => i !== idx),
    }));
  }

  async function handleDetailEditSave() {
    if (!detailEditForm || !detailEditOriginal) return;
    const hasNewFiles = Object.values(detailEditFiles).some(Boolean);
    const payload = buildPatchJsonPayload(detailEditForm, detailEditOriginal);

    if (Object.keys(payload).length === 0 && !hasNewFiles) {
      showMessage('success', 'Aucune modification détectée.');
      setDetailEditMode(false);
      return;
    }

    setSavingDetail(true);
    try {
      const url = buildUrlWithParams(API_PATHS.updateById, { id: detailEtab.id });
      let body, headers;

      if (hasNewFiles) {
        // Multipart : on envoie tous les champs texte + les nouveaux fichiers
        const fd = new FormData();
        // Champs texte/bool du payload (ou tout si présent)
        const allFields = { ...buildCreateJsonPayload(detailEditForm), ...payload };
        Object.entries(allFields).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          if (k === 'filieres' || k === 'marches_publics') {
            fd.append(k, JSON.stringify(v));
          } else {
            fd.append(k, String(v));
          }
        });
        // Nouveaux fichiers
        const fileFields = ['logo','acte_creation','acte_fonctionnement','acte_agrement',
          'acte_prise_en_charge','convention_etat_rdc','recteur_arrete','sga_arrete','ab_arrete',
          'titre_propriete_propriete','organigramme_fichier','acte_ecole_doctorale'];
        fileFields.forEach((f) => {
          if (detailEditFiles[f]) fd.append(f, detailEditFiles[f], detailEditFiles[f].name);
        });
        body = fd;
        headers = {};
      } else {
        body = JSON.stringify(payload);
        headers = { 'Content-Type': 'application/json' };
      }

      const updated = await apiRequest(url, { method: 'PATCH', headers, body });
      const normalized = normalizeEtablissement(updated);
      setDetailEtab(normalized);
      setAllEtablissements((prev) => prev.map((e) => e.id === normalized.id ? normalized : e));
      setDetailEditMode(false);
      setDetailEditFiles({});
      showMessage('success', 'Établissement mis à jour avec succès.');
    } catch (error) {
      showMessage('error', `Mise à jour impossible : ${error.message}`);
    } finally {
      setSavingDetail(false);
    }
  }

  async function handlePatchUpdate(event) {
    event.preventDefault();

    if (!updateForm || !originalUpdateForm) {
      showMessage('error', 'Chargez un etablissement avant la mise a jour.');
      return;
    }

    const patchPayload = buildPatchJsonPayload(updateForm, originalUpdateForm);
    if (Object.keys(patchPayload).length === 0) {
      showMessage('error', 'Aucune modification detectee pour PATCH.');
      return;
    }

    setSaving(true);
    try {
      const code = updateForm.code_etablissement?.trim();
      const targetUrl = code
        ? buildUrlWithParams(API_PATHS.updateByCode, { code })
        : buildUrlWithParams(API_PATHS.updateById, { id: updateForm.id });

      await apiRequest(targetUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      });

      setOriginalUpdateForm(updateForm);
      showMessage('success', 'Mise a jour partielle effectuee (PATCH).');
      await fetchEtablissements();
    } catch (error) {
      showMessage('error', `Mise a jour impossible: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSubmit() {
    const errors = validateCreateForm(createForm);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Aller à la première étape contenant une erreur
      const stepsWithErrors = [...new Set(Object.keys(errors).map((f) => CREATE_FIELD_STEPS[f] || 1))];
      const firstStep = Math.min(...stepsWithErrors);
      setCreateStep(firstStep);

      showMessage('error', Object.values(errors)[0]);
      return;
    }

    setSaving(true);
    try {
      const hasFiles =
        Boolean(createForm.logo) ||
        Boolean(createForm.acte_prise_en_charge) ||
        Boolean(createForm.convention_etat_rdc) ||
        Boolean(createForm.acte_creation) ||
        Boolean(createForm.acte_fonctionnement) ||
        Boolean(createForm.acte_agrement) ||
        Boolean(createForm.recteur_arrete) ||
        Boolean(createForm.sga_arrete) ||
        Boolean(createForm.ab_arrete) ||
        Boolean(createForm.titre_propriete_propriete) ||
        Boolean(createForm.organigramme_fichier) ||
        Boolean(createForm.acte_ecole_doctorale);
      const body = hasFiles
        ? buildCreateMultipartPayload(createForm)
        : JSON.stringify(buildCreateJsonPayload(createForm));

      await apiRequest(buildUrl(API_PATHS.create), {
        method: 'POST',
        headers: hasFiles ? {} : { 'Content-Type': 'application/json' },
        body,
      });

      setCreateForm(emptyCreateForm());
      setMarcheForm({ nom: '', telephone: '', email: '' });
      setFiliereForm({ nom: '', effectifs: [] });
      setEffectifDraftForm({ annee: '', total: '', masculin: '', feminin: '' });
      setAccordDraft('');
      setFormErrors({});
      setPage(1);

      showMessage(
        'success',
        hasFiles
          ? 'Etablissement cree avec multipart/form-data.'
          : 'Etablissement cree avec JSON.'
      );

      await fetchEtablissements();
    } catch (error) {
      // Erreurs de champs (ex: sigle déjà existant)
      if (error.fieldErrors) {
        const readable = Object.entries(error.fieldErrors)
          .map(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            // Traduction des messages d'erreur API courants
            const translated = msg
              .replace(/etablissement with this sigle etablissement already exists\./i, 'Un établissement avec ce sigle existe déjà.')
              .replace(/with this .+ already exists\./i, 'Cette valeur existe déjà.')
              .replace('already exists.', 'existe déjà.')
              .replace('This field may not be blank.', 'Ce champ est obligatoire.')
              .replace('This field is required.', 'Ce champ est obligatoire.')
              .replace('Enter a valid email address.', 'Adresse e-mail invalide.')
              .replace('Ensure this field has no more than', 'Ce champ ne doit pas dépasser')
              .replace('characters.', 'caractères.');
            return `• ${field} : ${translated}`;
          })
          .join('\n');
        showMessage('error', readable);
      } else {
        showMessage('error', `Création impossible : ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={view === 'map' ? 'app-map-mode' : 'app-shell'}>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="app-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span className="nav-brand">BASE DE DONNÉES DES ÉTABLISSEMENTS DE LA RDC</span>
        </div>
        <div className="nav-tabs">
          {view !== 'map' && (
            <button className="nav-tab nav-tab-back" onClick={() => setView('map')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span className="tab-label">Retour à l'accueil</span>
            </button>
          )}
          {view !== 'create' && (
            <button className="nav-tab nav-tab-identify" onClick={() => setShowNoticeModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="tab-label">Identifier l'établissement</span>
            </button>
          )}
          {view !== 'list' && (
            <button className="nav-tab nav-tab-list" onClick={() => setView('list')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
              <span className="tab-label">Voir la liste</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Modal Notice ───────────────────────────────── */}
      {showNoticeModal && (
        <div className="notice-overlay" onClick={() => setShowNoticeModal(false)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notice-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Notice
            </div>
            <div className="notice-body">
              <ul className="notice-list">
                <li>Toute fausse déclaration entraînera des sanctions conformément aux règles et mesures disciplinaires en vigueur.</li>
                <li>Ce formulaire est réservé <strong>exclusivement aux responsables des établissements</strong>.</li>
                <li>Veuillez compléter <strong>toutes les informations requises</strong> avec précision, sans omission.</li>
                <li>Veillez à <strong>ne pas enregistrer un établissement déjà existant</strong> dans la base de données.</li>
              </ul>
            </div>
            <div className="notice-footer">
              <button
                className="notice-btn-confirm"
                onClick={() => { setShowNoticeModal(false); setCreateStep(1); setView('create'); }}
              >
                J'ai compris, continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Saisie Code pour Détails ────────────── */}
      {showDetailCodeModal && (
        <div className="notice-overlay" onClick={() => setShowDetailCodeModal(false)}>
          <div className="notice-modal detail-code-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notice-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Accès sécurisé aux détails
            </div>
            <div className="notice-body">
              <p className="notice-text" style={{marginBottom:'1rem'}}>
                Pour accéder aux informations de cet établissement, veuillez saisir son <strong>code établissement</strong>.
              </p>
              <div className="create-input-wrap">
                <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input
                  className={`create-input${detailCodeError ? ' create-input-error' : ''}`}
                  autoFocus
                  value={detailCodeInput}
                  onChange={(e) => { setDetailCodeInput(e.target.value); setDetailCodeError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && loadDetail()}
                  placeholder="Ex : MINESURSI-ETAB001-026"
                />
              </div>
              {detailCodeError && (
                <p style={{margin:'0.5rem 0 0',fontSize:'0.78rem',color:'var(--red-600)'}}>
                  {detailCodeError}
                </p>
              )}
            </div>
            <div className="notice-footer" style={{gap:'0.5rem'}}>
              <button className="notice-btn-cancel" onClick={() => setShowDetailCodeModal(false)}>
                Annuler
              </button>
              <button className="notice-btn-confirm" onClick={() => loadDetail()} disabled={loadingDetail}>
                {loadingDetail
                  ? <><span className="spinner" style={{borderTopColor:'#fff'}} /> Recherche…</>
                  : 'Accéder aux détails'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Map ────────────────────────────────────────── */}
      {view === 'map' && (
        <MapView
          etablissements={etablissements}
          allEtablissements={filteredAll}
          onIdentify={() => setView('list')}
          onCreateClick={() => setView('create')}
          filters={filters}
          setFilters={setFilters}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalCount={totalCount}
          loadingList={loadingList}
        />
      )}

      {/* ── Toast popup ───────────────────────────────── */}
      {message.text && (
        <div key={`${message.type}-${message.text}`} className={`toast toast-${message.type === 'error' ? 'error' : 'success'}`}>
          <div className="toast-icon">
            {message.type === 'error'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            }
          </div>
          <span className="toast-text">{message.text}</span>
          <button className="toast-close" onClick={() => setMessage({ type: '', text: '' })}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="toast-bar" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VUE LISTE
      ══════════════════════════════════════════════════ */}
      {view === 'list' && (
        <main className="layout-grid">
          <section className="panel panel-wide">
            <h2 className="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Établissements
              {totalCount > 0 && (
                <span className="badge badge-public" style={{marginLeft:'auto',fontWeight:600}}>{totalCount} résultat{totalCount > 1 ? 's' : ''}</span>
              )}
            </h2>

            <div className="filters-bar">
              <span className="filters-label">Filtres</span>
              <div className="list-search-wrap">
                <svg className="list-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  className="list-search-input"
                  type="text"
                  placeholder="Rechercher nom, sigle…"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                {filters.search && (
                  <button className="list-search-clear" onClick={() => handleFilterChange('search', '')}>×</button>
                )}
              </div>
              <select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="public">Public</option>
                <option value="prive">Privé</option>
              </select>
              <ProvinceDropdown
                value={filters.province}
                onChange={(val) => handleFilterChange('province', val)}
                placeholder="Toutes les provinces"
              />
              <button type="button" className="btn btn-soft" style={{height:'var(--ctrl-h)'}} onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sigle</th>
                    <th>Établissement</th>
                    <th>Province</th>
                    <th>Statut</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList && (
                    <tr className="empty-row">
                      <td colSpan={5}>
                        <span className="spinner" style={{marginRight:'0.5rem'}} />
                        Chargement…
                      </td>
                    </tr>
                  )}
                  {!loadingList && etablissements.length === 0 && (
                    <tr className="empty-row">
                      <td colSpan={5}>Aucun établissement trouvé.</td>
                    </tr>
                  )}
                  {!loadingList && etablissements.map((item) => (
                    <tr key={item.id} className={selectedId === item.id ? 'selected-row' : ''}>
                      <td><strong>{item.sigle_etablissement || item.sigle || '—'}</strong></td>
                      <td>{toTitleCase(item.nom || item.nom_etablissement)}</td>
                      <td>{item.province || '—'}</td>
                      <td>
                        {item.statut
                          ? <span className={`badge badge-${item.statut === 'public' ? 'public' : 'prive'}`}>{item.statut}</span>
                          : <span style={{color:'var(--slate-400)'}}>—</span>
                        }
                      </td>
                      <td>
                        <button type="button" className="btn-link" onClick={() => { setDetailCodeInput(''); setDetailCodeError(''); setShowDetailCodeModal(item.id); }}>
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pagination-info">Page {page} sur {totalPages}</span>
              <button type="button" className="btn btn-soft btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                ← Précédent
              </button>
              <button type="button" className="btn btn-soft btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                Suivant →
              </button>
            </div>
          </section>
        </main>
      )}

      {/* ══════════════════════════════════════════════════
          VUE CRÉER
      ══════════════════════════════════════════════════ */}
      {view === 'create' && (
        <main className="create-main">
          <div className="create-container">

            {/* Page header */}
            <div className="create-header">
              <div className="create-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
                  <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/>
                </svg>
              </div>
              <div>
                <h1 className="create-title">Identifier un établissement</h1>
                <p className="create-subtitle">Renseignez les informations de l'établissement d'enseignement supérieur</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="step-line">
              {CREATE_STEPS.map((s) => (
                <button
                  key={s.num}
                  type="button"
                  className={`step-item${createStep === s.num ? ' step-active' : ''}${createStep > s.num ? ' step-done' : ''}`}
                  onClick={() => goToCreateStep(s.num)}
                >
                  <span className="step-circle">
                    {createStep > s.num
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                      : s.num}
                  </span>
                </button>
              ))}
            </div>

            <form className="create-form" onSubmit={(e) => e.preventDefault()}>

              {/* ─── Section 1 : Identification ─── */}
              {createStep === 1 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">1</div>
                  <div>
                    <h2 className="create-section-title">Identification de l'Établissement</h2>
                    <p className="create-section-desc">Informations d'identification officielle</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Nom établissement — full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Nom de l'établissement <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
                      <input
                        className={`create-input${formErrors.nom_etablissement ? ' create-input-error' : ''}`}
                        value={createForm.nom_etablissement}
                        onChange={(e) => handleCreateChange('nom_etablissement', e.target.value)}
                        placeholder="ex : Institut Supérieur Pédagogique de Kinshasa"
                      />
                    </div>
                    {formErrors.nom_etablissement && <span className="create-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{formErrors.nom_etablissement}</span>}
                  </div>

                  {/* Sigle */}
                  <div className="create-field">
                    <label className="create-label">Sigle de l'établissement <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      <input
                        className={`create-input${formErrors.sigle_etablissement ? ' create-input-error' : ''}`}
                        value={createForm.sigle_etablissement}
                        onChange={(e) => handleCreateChange('sigle_etablissement', e.target.value)}
                        placeholder="ex : ISP-KIN"
                      />
                    </div>
                    {formErrors.sigle_etablissement && <span className="create-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{formErrors.sigle_etablissement}</span>}
                  </div>

                  {/* Statut */}
                  <div className="create-field">
                    <label className="create-label">Statut <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <select
                        className={`create-input create-select${formErrors.statut ? ' create-input-error' : ''}`}
                        value={createForm.statut}
                        onChange={(e) => handleCreateChange('statut', e.target.value)}
                      >
                        <option value="public">Public</option>
                        <option value="prive">Privé</option>
                      </select>
                    </div>
                    {formErrors.statut && <span className="create-error">{formErrors.statut}</span>}
                  </div>

                  {/* Logo — full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Logo</label>
                    <input
                      type="file"
                      className="create-file-input"
                      accept="image/*"
                      onChange={(e) => handleCreateChange('logo', e.target.files?.[0] || null)}
                    />
                    {createForm.logo && <span className="create-doc-file">· {createForm.logo.name}</span>}
                  </div>

                  {isPrivateCreate && (
                    <>
                      {/* Pris en charge par l'État */}
                      <div className="create-field col-full">
                        <label className="create-label">Prise en charge par l'État ? <span className="create-required">*</span></label>
                        <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                          <label className="create-label-checkbox"><input type="radio" name="pris_en_charge_par_etat" checked={createForm.pris_en_charge_par_etat === true} onChange={() => handleCreateChange('pris_en_charge_par_etat', true)} required /> Oui</label>
                          <label className="create-label-checkbox"><input type="radio" name="pris_en_charge_par_etat" checked={createForm.pris_en_charge_par_etat === false} onChange={() => handleCreateChange('pris_en_charge_par_etat', false)} required /> Non</label>
                        </div>
                      </div>

                      {/* Acte de prise en charge */}
                      <div className="create-field col-full">
                        <label className="create-label">Acte de prise en charge <span className="create-required">*</span></label>
                        <input
                          type="file"
                          className={`create-file-input${formErrors.acte_prise_en_charge ? ' create-input-error' : ''}`}
                          required
                          onChange={(e) => handleCreateChange('acte_prise_en_charge', e.target.files?.[0] || null)}
                        />
                        {createForm.acte_prise_en_charge && <span className="create-doc-file">· {createForm.acte_prise_en_charge.name}</span>}
                        {formErrors.acte_prise_en_charge && <span className="create-error">{formErrors.acte_prise_en_charge}</span>}
                      </div>

                      {createForm.pris_en_charge_par_etat && (
                        <div className="create-field col-full">
                          <label className="create-label">Convention de l'État <span className="create-required">*</span></label>
                          <input
                            type="file"
                            className={`create-file-input${formErrors.convention_etat_rdc ? ' create-input-error' : ''}`}
                            required
                            onChange={(e) => handleCreateChange('convention_etat_rdc', e.target.files?.[0] || null)}
                          />
                          {createForm.convention_etat_rdc && <span className="create-doc-file">· {createForm.convention_etat_rdc.name}</span>}
                          {formErrors.convention_etat_rdc && <span className="create-error">{formErrors.convention_etat_rdc}</span>}
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>)}

              {/* ─── Section 2 : Localisation & Contact ─── */}
              {createStep === 2 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">2</div>
                  <div>
                    <h2 className="create-section-title">Localisation &amp; Contact de l'Établissement</h2>
                    <p className="create-section-desc">Coordonnées et informations de contact</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Adresse — full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Adresse <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input
                        className={`create-input${formErrors.adresse ? ' create-input-error' : ''}`}
                        value={createForm.adresse}
                        onChange={(e) => handleCreateChange('adresse', e.target.value)}
                        placeholder="ex : Avenue de l'Université, Kinshasa"
                      />
                    </div>
                    {formErrors.adresse && <span className="create-error">{formErrors.adresse}</span>}
                  </div>

                  {/* Rue / Avenue */}
                  <div className="create-field">
                    <label className="create-label">Rue / Avenue <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                      <input
                        className={`create-input${formErrors.rue_avenue ? ' create-input-error' : ''}`}
                        value={createForm.rue_avenue}
                        onChange={(e) => handleCreateChange('rue_avenue', e.target.value)}
                        placeholder="ex : Avenue Université"
                      />
                    </div>
                    {formErrors.rue_avenue && <span className="create-error">{formErrors.rue_avenue}</span>}
                  </div>

                  {/* Commune */}
                  <div className="create-field">
                    <label className="create-label">Commune <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                      <input
                        className={`create-input${formErrors.commune ? ' create-input-error' : ''}`}
                        value={createForm.commune}
                        onChange={(e) => handleCreateChange('commune', e.target.value)}
                        placeholder="ex : Lingwala"
                      />
                    </div>
                    {formErrors.commune && <span className="create-error">{formErrors.commune}</span>}
                  </div>

                  {/* Ville / Localité */}
                  <div className="create-field">
                    <label className="create-label">Ville / Localité <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <input
                        className={`create-input${formErrors.ville_localite ? ' create-input-error' : ''}`}
                        value={createForm.ville_localite}
                        onChange={(e) => handleCreateChange('ville_localite', e.target.value)}
                        placeholder="ex : Kinshasa"
                      />
                    </div>
                    {formErrors.ville_localite && <span className="create-error">{formErrors.ville_localite}</span>}
                  </div>

                  {/* Province */}
                  <div className="create-field">
                    <label className="create-label">Province <span className="create-required">*</span></label>
                    <ProvinceDropdown
                      required
                      placeholder="Sélectionner une province"
                      value={createForm.province}
                      onChange={(v) => handleCreateChange('province', v)}
                    />
                    {formErrors.province && <span className="create-error">{formErrors.province}</span>}
                  </div>

                  {/* Téléphone */}
                  <div className="create-field">
                    <label className="create-label">Téléphone <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      <input
                        className={`create-input${formErrors.telephone ? ' create-input-error' : ''}`}
                        value={createForm.telephone}
                        onChange={(e) => handleCreateChange('telephone', e.target.value)}
                        placeholder="+243 …"
                      />
                    </div>
                    {formErrors.telephone && <span className="create-error">{formErrors.telephone}</span>}
                  </div>

                  {/* Email */}
                  <div className="create-field">
                    <label className="create-label">Email <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input
                        type="email"
                        className={`create-input${formErrors.email ? ' create-input-error' : ''}`}
                        value={createForm.email}
                        onChange={(e) => handleCreateChange('email', e.target.value)}
                        placeholder="contact@etablissement.cd"
                      />
                    </div>
                    {formErrors.email && <span className="create-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{formErrors.email}</span>}
                  </div>

                  {/* Latitude + Longitude + bouton géolocalisation */}
                  <div className="create-field col-full create-gps-row">
                    <div className="create-gps-fields">
                      <div className="create-field">
                        <label className="create-label">Latitude</label>
                        <div className="create-input-wrap">
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                          <input
                            ref={latInputRef}
                            type="text"
                            inputMode="decimal"
                            maxLength={12}
                            className="create-input"
                            value={createForm.latitude}
                            onChange={(e) => handleCreateChange('latitude', e.target.value)}
                            placeholder="-4.327600"
                          />
                        </div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Longitude</label>
                        <div className="create-input-wrap">
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
                          <input
                            type="text"
                            inputMode="decimal"
                            maxLength={12}
                            className="create-input"
                            value={createForm.longitude}
                            onChange={(e) => handleCreateChange('longitude', e.target.value)}
                            placeholder="15.321500"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="create-btn-geolocate"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          setGeoBlocked(true);
                          return;
                        }
                        setDetectingGeo(true);
                        setGeoBlocked(false);

                        function applyCoords(lat, lng) {
                          handleCreateChange('latitude', String(parseFloat(lat).toFixed(6)));
                          handleCreateChange('longitude', String(parseFloat(lng).toFixed(6)));
                          setDetectingGeo(false);
                          setGeoBlocked(false);
                        }

                        function tryIpGeo() {
                          fetch('https://ipwho.is/')
                            .then((r) => r.json())
                            .then((d) => {
                              if (d && d.latitude != null && d.longitude != null) {
                                applyCoords(d.latitude, d.longitude);
                              } else {
                                return fetch('https://ipapi.co/json/');
                              }
                            })
                            .then((r) => r && r.json())
                            .then((d) => {
                              if (d && d.latitude != null && d.longitude != null) {
                                applyCoords(d.latitude, d.longitude);
                              }
                            })
                            .catch(() => {
                              setDetectingGeo(false);
                              showMessage('error', 'Impossible de détecter la position. Saisissez manuellement.');
                              setTimeout(() => latInputRef.current?.focus(), 100);
                            });
                        }

                        // Essai GPS navigateur (3s) puis fallback IP automatique
                        if (navigator.geolocation) {
                          const timer = setTimeout(() => tryIpGeo(), 3000);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => { clearTimeout(timer); applyCoords(pos.coords.latitude, pos.coords.longitude); },
                            () => { clearTimeout(timer); tryIpGeo(); },
                            { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
                          );
                        } else {
                          tryIpGeo();
                        }
                      }}
                    >
                      {detectingGeo
                        ? <><span className="spinner" style={{width:12,height:12}} /> Détection…</>
                        : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 4"/></svg> Détecter ma position</>
                      }
                    </button>
                  </div>
                  <p className="create-hint">
                    Cliquez sur <strong>Détecter ma position</strong> pour remplir automatiquement, ou saisissez manuellement les coordonnées GPS de l'établissement (trouvables sur Google Maps).
                  </p>
                  {geoBlocked && (
                    <div className="geo-blocked-banner">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>
                        La géolocalisation est <strong>bloquée</strong> par le navigateur. Pour la débloquer :
                        cliquez sur l'icône <strong>🔒</strong> dans la barre d'adresse → <strong>Paramètres du site</strong> → <strong>Localisation</strong> → <strong>Autoriser</strong>, puis rechargez.
                        Ou saisissez les coordonnées ci-dessus manuellement.
                      </span>
                      <button type="button" className="geo-blocked-close" onClick={() => setGeoBlocked(false)}>✕</button>
                    </div>
                  )}

                  {/* Description — full width, textarea */}
                  <div className="create-field col-full">
                    <label className="create-label">Description</label>
                    <div className="create-input-wrap create-textarea-wrap">
                      <svg className="create-input-icon create-input-icon-top" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                      <textarea
                        className="create-input create-textarea"
                        value={createForm.description}
                        onChange={(e) => handleCreateChange('description', e.target.value)}
                        placeholder="Brève description de l'établissement…"
                        rows={3}
                      />
                    </div>
                  </div>

                </div>
              </div>)}

              {/* ─── Section 3 : Création & Autorisation ─── */}
              {createStep === 3 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">3</div>
                  <div>
                    <h2 className="create-section-title">Création &amp; Autorisation</h2>
                    <p className="create-section-desc">Actes officiels et date de création</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Date de création — full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Date de création <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <input
                        type="date"
                        className={`create-input${formErrors.date_creation ? ' create-input-error' : ''}`}
                        value={createForm.date_creation}
                        onChange={(e) => handleCreateChange('date_creation', e.target.value)}
                      />
                    </div>
                    {formErrors.date_creation && <span className="create-error">{formErrors.date_creation}</span>}
                  </div>

                  {/* Acte de création */}
                  <div className="create-field">
                    <label className="create-label">Acte juridique de création <span className="create-required">*</span></label>
                    <input
                      type="file"
                      className={`create-file-input${formErrors.acte_creation ? ' create-input-error' : ''}`}
                      required
                      onChange={(e) => handleCreateChange('acte_creation', e.target.files?.[0] || null)}
                    />
                    {createForm.acte_creation && <span className="create-doc-file">· {createForm.acte_creation.name}</span>}
                    {formErrors.acte_creation && <span className="create-error">{formErrors.acte_creation}</span>}
                  </div>

                  {isPrivateCreate && (
                    <>
                      {/* Acte de fonctionnement */}
                      <div className="create-field">
                        <label className="create-label">Acte juridique d'autorisation de fonctionnement <span className="create-required">*</span></label>
                        <input
                          type="file"
                          className={`create-file-input${formErrors.acte_fonctionnement ? ' create-input-error' : ''}`}
                          required
                          onChange={(e) => handleCreateChange('acte_fonctionnement', e.target.files?.[0] || null)}
                        />
                        {createForm.acte_fonctionnement && <span className="create-doc-file">· {createForm.acte_fonctionnement.name}</span>}
                        {formErrors.acte_fonctionnement && <span className="create-error">{formErrors.acte_fonctionnement}</span>}
                      </div>

                      {/* Acte d'agrément */}
                      <div className="create-field">
                        <label className="create-label">Acte juridique d'agrément <span className="create-required">*</span></label>
                        <input
                          type="file"
                          className={`create-file-input${formErrors.acte_agrement ? ' create-input-error' : ''}`}
                          required
                          onChange={(e) => handleCreateChange('acte_agrement', e.target.files?.[0] || null)}
                        />
                        {createForm.acte_agrement && <span className="create-doc-file">· {createForm.acte_agrement.name}</span>}
                        {formErrors.acte_agrement && <span className="create-error">{formErrors.acte_agrement}</span>}
                      </div>
                    </>
                  )}

                </div>
              </div>)}

              {/* ─── Section 4 : Comité de gestion ─── */}
              {createStep === 4 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">4</div>
                  <div>
                    <h2 className="create-section-title">Comité de gestion</h2>
                    <p className="create-section-desc">Responsables officiels de l'établissement</p>
                  </div>
                </div>

                {/* ── Recteur ── */}
                <div className="create-comite-block">
                  <div className="create-comite-label">Recteur / DG </div>
                  <div className="create-grid">
                    <div className="create-field">
                      <label className="create-label">Nom complet <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input className={`create-input${formErrors.recteur_nom ? ' create-input-error' : ''}`} value={createForm.recteur_nom} onChange={(e) => handleCreateChange('recteur_nom', e.target.value)} placeholder="Nom du recteur" />
                      </div>
                      {formErrors.recteur_nom && <span className="create-error">{formErrors.recteur_nom}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Sexe <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <select className={`create-input create-select create-select-no-icon${formErrors.recteur_sexe ? ' create-input-error' : ''}`} value={createForm.recteur_sexe} onChange={(e) => handleCreateChange('recteur_sexe', e.target.value)}>
                          <option value="">—</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      {formErrors.recteur_sexe && <span className="create-error">{formErrors.recteur_sexe}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Grade <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input className={`create-input${formErrors.recteur_grade ? ' create-input-error' : ''}`} value={createForm.recteur_grade} onChange={(e) => handleCreateChange('recteur_grade', e.target.value)} placeholder="ex : Professeur Ordinaire" />
                      </div>
                      {formErrors.recteur_grade && <span className="create-error">{formErrors.recteur_grade}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Téléphone <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        <input className={`create-input${formErrors.recteur_telephone ? ' create-input-error' : ''}`} value={createForm.recteur_telephone} onChange={(e) => handleCreateChange('recteur_telephone', e.target.value)} placeholder="+243 …" />
                      </div>
                      {formErrors.recteur_telephone && <span className="create-error">{formErrors.recteur_telephone}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">E-mail <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input type="email" className={`create-input${formErrors.recteur_email ? ' create-input-error' : ''}`} value={createForm.recteur_email} onChange={(e) => handleCreateChange('recteur_email', e.target.value)} placeholder="recteur@etab.cd" />
                      </div>
                      {formErrors.recteur_email && <span className="create-error">{formErrors.recteur_email}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Arrêté de nomination <span className="create-required">*</span></label>
                      <input type="file" className={`create-file-input${formErrors.recteur_arrete ? ' create-input-error' : ''}`} required onChange={(e) => handleCreateChange('recteur_arrete', e.target.files?.[0] || null)} />
                      {createForm.recteur_arrete && <span className="create-doc-file">· {createForm.recteur_arrete.name}</span>}
                      {formErrors.recteur_arrete && <span className="create-error">{formErrors.recteur_arrete}</span>}
                    </div>
                    {/* Recteur — En fonction */}
                    <div className="create-field col-full">
                      <label className="create-label">En fonction ? <span className="create-required">*</span></label>
                      <div style={{display:'flex',gap:'1.5rem'}}>
                        <label className="create-label-checkbox"><input type="radio" name="recteur_en_fonction" checked={createForm.recteur_en_fonction === true} onChange={() => handleCreateChange('recteur_en_fonction', true)} /> Oui</label>
                        <label className="create-label-checkbox"><input type="radio" name="recteur_en_fonction" checked={createForm.recteur_en_fonction === false} onChange={() => handleCreateChange('recteur_en_fonction', false)} /> Non</label>
                      </div>
                    </div>
                    {createForm.recteur_en_fonction === false && (
                      <>
                        <div className="create-field">
                          <label className="create-label">Hors fonction depuis</label>
                          <div className="create-input-wrap">
                            <input type="date" className="create-input create-input-no-icon" value={createForm.recteur_hors_fonction_depuis} onChange={(e) => handleCreateChange('recteur_hors_fonction_depuis', e.target.value)} />
                          </div>
                        </div>
                        <div className="create-field">
                          <label className="create-label">Motif</label>
                          <div className="create-input-wrap">
                            <input className="create-input create-input-no-icon" value={createForm.recteur_hors_fonction_motif} onChange={(e) => handleCreateChange('recteur_hors_fonction_motif', e.target.value)} placeholder="Ex : démission, révocation…" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ── SGA ── */}
                <div className="create-comite-block">
                  <div className="create-comite-label">Secrétaire Général Académique (SGA)</div>
                  <div className="create-grid">
                    <div className="create-field">
                      <label className="create-label">Nom complet <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input className={`create-input${formErrors.sga_nom ? ' create-input-error' : ''}`} value={createForm.sga_nom} onChange={(e) => handleCreateChange('sga_nom', e.target.value)} placeholder="Nom du SGA" />
                      </div>
                      {formErrors.sga_nom && <span className="create-error">{formErrors.sga_nom}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Sexe <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <select className={`create-input create-select create-select-no-icon${formErrors.sga_sexe ? ' create-input-error' : ''}`} value={createForm.sga_sexe} onChange={(e) => handleCreateChange('sga_sexe', e.target.value)}>
                          <option value="">—</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      {formErrors.sga_sexe && <span className="create-error">{formErrors.sga_sexe}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Grade <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input className={`create-input${formErrors.sga_grade ? ' create-input-error' : ''}`} value={createForm.sga_grade} onChange={(e) => handleCreateChange('sga_grade', e.target.value)} placeholder="ex : Chef de travaux" />
                      </div>
                      {formErrors.sga_grade && <span className="create-error">{formErrors.sga_grade}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Téléphone <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        <input className={`create-input${formErrors.sga_telephone ? ' create-input-error' : ''}`} value={createForm.sga_telephone} onChange={(e) => handleCreateChange('sga_telephone', e.target.value)} placeholder="+243 …" />
                      </div>
                      {formErrors.sga_telephone && <span className="create-error">{formErrors.sga_telephone}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Email <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input type="email" className={`create-input${formErrors.sga_email ? ' create-input-error' : ''}`} value={createForm.sga_email} onChange={(e) => handleCreateChange('sga_email', e.target.value)} placeholder="sga@etab.cd" />
                      </div>
                      {formErrors.sga_email && <span className="create-error">{formErrors.sga_email}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Arrêté de nomination <span className="create-required">*</span></label>
                      <input type="file" className={`create-file-input${formErrors.sga_arrete ? ' create-input-error' : ''}`} required onChange={(e) => handleCreateChange('sga_arrete', e.target.files?.[0] || null)} />
                      {createForm.sga_arrete && <span className="create-doc-file">· {createForm.sga_arrete.name}</span>}
                      {formErrors.sga_arrete && <span className="create-error">{formErrors.sga_arrete}</span>}
                    </div>
                    {/* SGA — En fonction */}
                    <div className="create-field col-full">
                      <label className="create-label">En fonction ? <span className="create-required">*</span></label>
                      <div style={{display:'flex',gap:'1.5rem'}}>
                        <label className="create-label-checkbox"><input type="radio" name="sga_en_fonction" checked={createForm.sga_en_fonction === true} onChange={() => handleCreateChange('sga_en_fonction', true)} /> Oui</label>
                        <label className="create-label-checkbox"><input type="radio" name="sga_en_fonction" checked={createForm.sga_en_fonction === false} onChange={() => handleCreateChange('sga_en_fonction', false)} /> Non</label>
                      </div>
                    </div>
                    {createForm.sga_en_fonction === false && (
                      <>
                        <div className="create-field">
                          <label className="create-label">Hors fonction depuis</label>
                          <div className="create-input-wrap">
                            <input type="date" className="create-input create-input-no-icon" value={createForm.sga_hors_fonction_depuis} onChange={(e) => handleCreateChange('sga_hors_fonction_depuis', e.target.value)} />
                          </div>
                        </div>
                        <div className="create-field">
                          <label className="create-label">Motif</label>
                          <div className="create-input-wrap">
                            <input className="create-input create-input-no-icon" value={createForm.sga_hors_fonction_motif} onChange={(e) => handleCreateChange('sga_hors_fonction_motif', e.target.value)} placeholder="Ex : démission, révocation…" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="create-comite-block">
                  <div className="create-comite-label">Administrateur du Budget (AB)</div>
                  <div className="create-grid">
                    <div className="create-field">
                      <label className="create-label">Nom complet <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input className={`create-input${formErrors.ab_nom ? ' create-input-error' : ''}`} value={createForm.ab_nom} onChange={(e) => handleCreateChange('ab_nom', e.target.value)} placeholder="Nom de l'AB" />
                      </div>
                      {formErrors.ab_nom && <span className="create-error">{formErrors.ab_nom}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Sexe <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <select className={`create-input create-select create-select-no-icon${formErrors.ab_sexe ? ' create-input-error' : ''}`} value={createForm.ab_sexe} onChange={(e) => handleCreateChange('ab_sexe', e.target.value)}>
                          <option value="">—</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      {formErrors.ab_sexe && <span className="create-error">{formErrors.ab_sexe}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Grade <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input className={`create-input${formErrors.ab_grade ? ' create-input-error' : ''}`} value={createForm.ab_grade} onChange={(e) => handleCreateChange('ab_grade', e.target.value)} placeholder="ex : Assistant" />
                      </div>
                      {formErrors.ab_grade && <span className="create-error">{formErrors.ab_grade}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Téléphone <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        <input className={`create-input${formErrors.ab_telephone ? ' create-input-error' : ''}`} value={createForm.ab_telephone} onChange={(e) => handleCreateChange('ab_telephone', e.target.value)} placeholder="+243 …" />
                      </div>
                      {formErrors.ab_telephone && <span className="create-error">{formErrors.ab_telephone}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Email <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input type="email" className={`create-input${formErrors.ab_email ? ' create-input-error' : ''}`} value={createForm.ab_email} onChange={(e) => handleCreateChange('ab_email', e.target.value)} placeholder="ab@etab.cd" />
                      </div>
                      {formErrors.ab_email && <span className="create-error">{formErrors.ab_email}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Arrêté de nomination <span className="create-required">*</span></label>
                      <input type="file" className={`create-file-input${formErrors.ab_arrete ? ' create-input-error' : ''}`} required onChange={(e) => handleCreateChange('ab_arrete', e.target.files?.[0] || null)} />
                      {createForm.ab_arrete && <span className="create-doc-file">· {createForm.ab_arrete.name}</span>}
                      {formErrors.ab_arrete && <span className="create-error">{formErrors.ab_arrete}</span>}
                    </div>
                    {/* AB — En fonction */}
                    <div className="create-field col-full">
                      <label className="create-label">En fonction ? <span className="create-required">*</span></label>
                      <div style={{display:'flex',gap:'1.5rem'}}>
                        <label className="create-label-checkbox"><input type="radio" name="ab_en_fonction" checked={createForm.ab_en_fonction === true} onChange={() => handleCreateChange('ab_en_fonction', true)} /> Oui</label>
                        <label className="create-label-checkbox"><input type="radio" name="ab_en_fonction" checked={createForm.ab_en_fonction === false} onChange={() => handleCreateChange('ab_en_fonction', false)} /> Non</label>
                      </div>
                    </div>
                    {createForm.ab_en_fonction === false && (
                      <>
                        <div className="create-field">
                          <label className="create-label">Hors fonction depuis</label>
                          <div className="create-input-wrap">
                            <input type="date" className="create-input create-input-no-icon" value={createForm.ab_hors_fonction_depuis} onChange={(e) => handleCreateChange('ab_hors_fonction_depuis', e.target.value)} />
                          </div>
                        </div>
                        <div className="create-field">
                          <label className="create-label">Motif</label>
                          <div className="create-input-wrap">
                            <input className="create-input create-input-no-icon" value={createForm.ab_hors_fonction_motif} onChange={(e) => handleCreateChange('ab_hors_fonction_motif', e.target.value)} placeholder="Ex : démission, révocation…" />
                          </div>
                        </div>
                      </>
                    )} 
                  </div>
                </div>

                {/* ── SGR ── */}
                <div className="create-comite-block">
                  <div className="create-comite-label">Secrétaire Général à la Recherche (SGR)</div>
                  <div className="create-grid">
                    <div className="create-field">
                      <label className="create-label">Nom complet <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input className={`create-input${formErrors.sgr_nom ? ' create-input-error' : ''}`} value={createForm.sgr_nom} onChange={(e) => handleCreateChange('sgr_nom', e.target.value)} placeholder="Nom du SGR" />
                      </div>
                      {formErrors.sgr_nom && <span className="create-error">{formErrors.sgr_nom}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Sexe <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <select className={`create-input create-select create-select-no-icon${formErrors.sgr_sexe ? ' create-input-error' : ''}`} value={createForm.sgr_sexe} onChange={(e) => handleCreateChange('sgr_sexe', e.target.value)}>
                          <option value="">—</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      {formErrors.sgr_sexe && <span className="create-error">{formErrors.sgr_sexe}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Grade <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input className={`create-input${formErrors.sgr_grade ? ' create-input-error' : ''}`} value={createForm.sgr_grade} onChange={(e) => handleCreateChange('sgr_grade', e.target.value)} placeholder="ex : Professeur" />
                      </div>
                      {formErrors.sgr_grade && <span className="create-error">{formErrors.sgr_grade}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Téléphone <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        <input className={`create-input${formErrors.sgr_telephone ? ' create-input-error' : ''}`} value={createForm.sgr_telephone} onChange={(e) => handleCreateChange('sgr_telephone', e.target.value)} placeholder="+243 …" />
                      </div>
                      {formErrors.sgr_telephone && <span className="create-error">{formErrors.sgr_telephone}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Email <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input type="email" className={`create-input${formErrors.sgr_email ? ' create-input-error' : ''}`} value={createForm.sgr_email} onChange={(e) => handleCreateChange('sgr_email', e.target.value)} placeholder="sgr@etab.cd" />
                      </div>
                      {formErrors.sgr_email && <span className="create-error">{formErrors.sgr_email}</span>}
                    </div>
                    <div className="create-field">
                      <label className="create-label">Arrêté de nomination <span className="create-required">*</span></label>
                      <input type="file" className={`create-file-input${formErrors.sgr_arrete ? ' create-input-error' : ''}`} required onChange={(e) => handleCreateChange('sgr_arrete', e.target.files?.[0] || null)} />
                      {createForm.sgr_arrete && <span className="create-doc-file">· {createForm.sgr_arrete.name}</span>}
                      {formErrors.sgr_arrete && <span className="create-error">{formErrors.sgr_arrete}</span>}
                    </div>
                    {/* SGR — En fonction */}
                    <div className="create-field col-full">
                      <label className="create-label">En fonction ? <span className="create-required">*</span></label>
                      <div style={{display:'flex',gap:'1.5rem'}}>
                        <label className="create-label-checkbox"><input type="radio" name="sgr_en_fonction" checked={createForm.sgr_en_fonction === true} onChange={() => handleCreateChange('sgr_en_fonction', true)} /> Oui</label>
                        <label className="create-label-checkbox"><input type="radio" name="sgr_en_fonction" checked={createForm.sgr_en_fonction === false} onChange={() => handleCreateChange('sgr_en_fonction', false)} /> Non</label>
                      </div>
                    </div>
                    {createForm.sgr_en_fonction === false && (
                      <>
                        <div className="create-field">
                          <label className="create-label">Hors fonction depuis</label>
                          <div className="create-input-wrap">
                            <input type="date" className="create-input create-input-no-icon" value={createForm.sgr_hors_fonction_depuis} onChange={(e) => handleCreateChange('sgr_hors_fonction_depuis', e.target.value)} />
                          </div>
                        </div>
                        <div className="create-field">
                          <label className="create-label">Motif</label>
                          <div className="create-input-wrap">
                            <input className="create-input create-input-no-icon" value={createForm.sgr_hors_fonction_motif} onChange={(e) => handleCreateChange('sgr_hors_fonction_motif', e.target.value)} placeholder="Ex : démission, révocation…" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>)}

              {/* ─── Section 5 : Ressources humaines ─── */}
              {createStep === 5 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">5</div>
                  <div>
                    <h2 className="create-section-title">Ressources humaines</h2>
                    <p className="create-section-desc">Effectifs du personnel enseignant et scientifique</p>
                  </div>
                </div>

                <div className="create-grid">
                  {[
                    { key: 'total_enseignants', label: 'Nombre total d\'enseignants' },
                    { key: 'pa', label: 'Professeurs Associés (PA)' },
                    { key: 'p', label: 'Professeurs (P)' },
                    { key: 'po', label: 'Professeurs Ordinaires (PO)' },
                    { key: 'enseignants_femmes', label: 'Effectif d\'enseignants de sexe féminin' },
                  ].map(({ key, label }) => (
                    <div key={key} className="create-field">
                      <label className="create-label">{label} <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input type="number" min="0" step="1" className={`create-input create-input-no-icon${formErrors[key] ? ' create-input-error' : ''}`} value={createForm[key]} onChange={(e) => handleCreateChange(key, e.target.value)} placeholder="0" />
                      </div>
                      {formErrors[key] && <span className="create-error">{formErrors[key]}</span>}
                    </div>
                  ))}

                  {/* Groupe — Personnel scientifique */}
                  <div className="create-field col-full create-group-header">
                    <span className="create-group-label">Personnel scientifique</span>
                  </div>
                  {[
                    { key: 'chefs_travaux', label: 'Chefs des travaux' },
                    { key: 'assistants', label: 'Assistants' },
                    { key: 'charges_pratiques_professionnelles', label: 'Chargés de pratiques professionnelles' },
                    { key: 'personnel_scientifique_femmes', label: 'Effectif du personnel scientifique de sexe féminin' },
                  ].map(({ key, label }) => (
                    <div key={key} className="create-field">
                      <label className="create-label">{label} <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input type="number" min="0" step="1" className={`create-input create-input-no-icon${formErrors[key] ? ' create-input-error' : ''}`} value={createForm[key]} onChange={(e) => handleCreateChange(key, e.target.value)} placeholder="0" />
                      </div>
                      {formErrors[key] && <span className="create-error">{formErrors[key]}</span>}
                    </div>
                  ))}

                  {/* Groupe — Effectif PATO */}
                  <div className="create-field col-full create-group-header">
                    <span className="create-group-label">Effectif PATO</span>
                  </div>
                  {[
                    { key: 'cadres_commandement', label: 'Cadres de commandement' },
                    { key: 'cadres_collaboration', label: 'Cadres de collaboration' },
                    { key: 'agents_execution', label: 'Agents d\'exécution' },
                  ].map(({ key, label }) => (
                    <div key={key} className="create-field">
                      <label className="create-label">{label} <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input type="number" min="0" step="1" className={`create-input create-input-no-icon${formErrors[key] ? ' create-input-error' : ''}`} value={createForm[key]} onChange={(e) => handleCreateChange(key, e.target.value)} placeholder="0" />
                      </div>
                      {formErrors[key] && <span className="create-error">{formErrors[key]}</span>}
                    </div>
                  ))}
                </div>
              </div>)}

              {/* ─── Section 6 : Organisation académique ─── */}
              {createStep === 6 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">6</div>
                  <div>
                    <h2 className="create-section-title">Organisation académique</h2>
                    <p className="create-section-desc">Filières, niveaux et effectifs d'étudiants</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Filières — liste dynamique */}
                  <div className="create-field col-full">
                    <label className="create-label">Filières Organisées <span className="create-required">*</span></label>
                    {formErrors.filieres && <span className="create-error">{formErrors.filieres}</span>}

                    {createForm.filieres.length > 0 && (
                      <ul className="create-doc-list" style={{marginBottom:'0.75rem'}}>
                        {createForm.filieres.map((f, i) => (
                          <li key={i} className="create-doc-item" style={{flexDirection:'column',alignItems:'flex-start',gap:'0.35rem',paddingBottom:'0.5rem'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'100%'}}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{color:'var(--blue-400)',flexShrink:0}}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                              <span className="create-doc-name" style={{fontWeight:600}}>{f.nom}</span>
                              <span style={{fontSize:'0.7rem',color:'var(--slate-400)',marginLeft:'auto'}}>{f.effectifs.length} effectif{f.effectifs.length !== 1 ? 's' : ''}</span>
                              <button type="button" className="create-doc-remove" onClick={() => removeFiliere(i)} title="Retirer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                            {f.effectifs.length > 0 && (
                              <table style={{fontSize:'0.7rem',borderCollapse:'collapse',width:'calc(100% - 1.3rem)',marginLeft:'1.3rem'}}>
                                <thead>
                                  <tr style={{color:'var(--slate-400)'}}>
                                    <th style={{textAlign:'left',fontWeight:600,paddingRight:'1rem',paddingBottom:'0.2rem'}}>Année</th>
                                    <th style={{textAlign:'right',fontWeight:600,paddingRight:'1rem',paddingBottom:'0.2rem'}}>Total</th>
                                    <th style={{textAlign:'right',fontWeight:600,paddingRight:'1rem',paddingBottom:'0.2rem'}}>M</th>
                                    <th style={{textAlign:'right',fontWeight:600,paddingBottom:'0.2rem'}}>F</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {f.effectifs.map((e, j) => (
                                    <tr key={j} style={{color:'var(--slate-600)'}}>
                                      <td style={{paddingRight:'1rem'}}>{e.annee}</td>
                                      <td style={{textAlign:'right',paddingRight:'1rem'}}>{e.total}</td>
                                      <td style={{textAlign:'right',paddingRight:'1rem'}}>{e.masculin}</td>
                                      <td style={{textAlign:'right'}}>{e.feminin}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* formulaire d'ajout d'une filière */}
                    <div style={{border:'1px solid var(--slate-200)',borderRadius:'8px',padding:'0.75rem',background:'var(--slate-50)'}}>
                      {/* nom */}
                      <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.6rem'}}>
                        <div className="create-input-wrap" style={{flex:1}}>
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                          <input
                            className={`create-input${formErrors.filieres ? ' create-input-error' : ''}`}
                            value={filiereForm.nom}
                            onChange={(e) => setFiliereForm((p) => ({ ...p, nom: e.target.value }))}
                            placeholder="Nom de la filière, ex : Informatique"
                          />
                        </div>
                      </div>

                      {/* effectifs déjà saisis pour cette filière */}
                      {filiereForm.effectifs.length > 0 && (
                        <table style={{fontSize:'0.7rem',borderCollapse:'collapse',width:'100%',marginBottom:'0.5rem'}}>
                          <thead>
                            <tr style={{color:'var(--slate-400)'}}>
                              <th style={{textAlign:'left',fontWeight:600,paddingRight:'0.75rem',paddingBottom:'0.2rem'}}>Année</th>
                              <th style={{textAlign:'right',fontWeight:600,paddingRight:'0.75rem',paddingBottom:'0.2rem'}}>Total</th>
                              <th style={{textAlign:'right',fontWeight:600,paddingRight:'0.75rem',paddingBottom:'0.2rem'}}>Masc.</th>
                              <th style={{textAlign:'right',fontWeight:600,paddingRight:'0.75rem',paddingBottom:'0.2rem'}}>Fém.</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filiereForm.effectifs.map((e, j) => (
                              <tr key={j} style={{color:'var(--slate-600)'}}>
                                <td style={{paddingRight:'0.75rem'}}>{e.annee}</td>
                                <td style={{textAlign:'right',paddingRight:'0.75rem'}}>{e.total}</td>
                                <td style={{textAlign:'right',paddingRight:'0.75rem'}}>{e.masculin}</td>
                                <td style={{textAlign:'right',paddingRight:'0.75rem'}}>{e.feminin}</td>
                                <td>
                                  <button type="button" className="create-doc-remove" onClick={() => removeEffectifFromDraft(j)} title="Retirer">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* ligne d'ajout d'un effectif annuel */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:'0.4rem',alignItems:'flex-end',marginBottom:'0.6rem'}}>
                        {[
                          ['annee',   'Année',    'number', '2025'],
                          ['total',   'Total',    'number', '1200'],
                          ['masculin','Masculin',  'number', '700'],
                          ['feminin', 'Féminin',  'number', '500'],
                        ].map(([key, lbl, type, ph]) => (
                          <div key={key}>
                            <label style={{fontSize:'0.68rem',fontWeight:600,color:'var(--slate-500)',display:'block',marginBottom:'0.2rem'}}>{lbl}</label>
                            <input
                              type={type}
                              min="0"
                              className="create-input create-input-no-icon"
                              value={effectifDraftForm[key]}
                              onChange={(e) => setEffectifDraftForm((p) => ({ ...p, [key]: e.target.value }))}
                              placeholder={ph}
                            />
                          </div>
                        ))}
                        <button type="button" className="create-btn-doc-add" style={{alignSelf:'flex-end',whiteSpace:'nowrap'}} onClick={addEffectifToDraft}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Effectif
                        </button>
                      </div>

                      <button type="button" className="create-btn-doc-add" onClick={addFiliere} style={{width:'100%',justifyContent:'center'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter la filière
                      </button>
                    </div>
                  </div>

                  {/* ── Accords de mobilités internationales ── */}
                  <div className="create-field col-full">
                    <label className="create-label">Accords de mobilité internationale des étudiants <span className="create-required">*</span></label>
                    {formErrors.accords_mobilite && <span className="create-error">{formErrors.accords_mobilite}</span>}

                    {createForm.accords_mobilite.length > 0 && (
                      <ul className="create-doc-list" style={{marginBottom:'0.6rem'}}>
                        {createForm.accords_mobilite.map((a, i) => (
                          <li key={i} className="create-doc-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{color:'var(--blue-400)',flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                            <span className="create-doc-name">{a.accord}</span>
                            <button type="button" className="create-doc-remove" onClick={() => removeAccordMobilite(i)} title="Retirer">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <div className="create-input-wrap" style={{flex:1}}>
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        <input
                          className={`create-input${formErrors.accords_mobilite ? ' create-input-error' : ''}`}
                          value={accordDraft}
                          onChange={(e) => setAccordDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAccordMobilite(); } }}
                          placeholder="Ex : Accord avec Université de Paris"
                        />
                      </div>
                      <button type="button" className="create-btn-doc-add" onClick={addAccordMobilite}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter un accord
                      </button>
                    </div>
                  </div>

                  {/* Niveaux d'études */}
                  <div className="create-field col-full">
                    <label className="create-label">Niveaux d'études <span className="create-required">*</span></label>
                    <div className="create-niveaux-row">
                      {[['licence', 'Licence'], ['master', 'Master'], ['doctorat', 'Doctorat']].map(([key, label]) => (
                        <label key={key} className="create-label-checkbox">
                          <input
                            type="checkbox"
                            className="create-checkbox"
                            checked={createForm[key]}
                            onChange={(e) => handleCreateChange(key, e.target.checked)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {formErrors.niveaux_etudes && <span className="create-error">{formErrors.niveaux_etudes}</span>}
                  </div>

                  {/* Autres niveaux */}
                  <div className="create-field col-full">
                    <label className="create-label">Autres niveaux <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <input
                        className={`create-input create-input-no-icon${formErrors.autres_niveaux ? ' create-input-error' : ''}`}
                        value={createForm.autres_niveaux}
                        onChange={(e) => handleCreateChange('autres_niveaux', e.target.value)}
                        placeholder="ex : DES, Certificat…"
                      />
                    </div>
                    {formErrors.autres_niveaux && <span className="create-error">{formErrors.autres_niveaux}</span>}
                  </div>

                  {/* Effectifs */}
                  {[
                    { key: 'effectif_licence_total', label: 'Effectif Licence (total)' },
                    { key: 'effectif_master_total', label: 'Effectif Master (total)' },
                    { key: 'effectif_doctorat_total', label: 'Effectif Doctorat (total)' },
                    { key: 'nombre_etudiants_lmd', label: 'Étudiants LMD (total)' },
                  ].map(({ key, label }) => (
                    <div key={key} className="create-field">
                      <label className="create-label">{label} <span className="create-required">*</span></label>
                      <div className="create-input-wrap">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className={`create-input create-input-no-icon${formErrors[key] ? ' create-input-error' : ''}`}
                          value={createForm[key]}
                          onChange={(e) => handleCreateChange(key, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      {formErrors[key] && <span className="create-error">{formErrors[key]}</span>}
                    </div>
                  ))}

                </div>
              </div>)}

              {/* ─── Section 7 : Patrimoine immobilier ─── */}
              {createStep === 7 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">7</div>
                  <div>
                    <h2 className="create-section-title">Patrimoine immobilier</h2>
                    <p className="create-section-desc">Titres fonciers, location et responsable du patrimoine</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Titre de propriété — fichier, full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Etablissement a un titre de propriété immobilière <span className="create-required">*</span></label>
                    <input
                      type="file"
                      className={`create-file-input${formErrors.titre_propriete_propriete ? ' create-input-error' : ''}`}
                      onChange={(e) => handleCreateChange('titre_propriete_propriete', e.target.files?.[0] || null)}
                    />
                    {createForm.titre_propriete_propriete && <span className="create-doc-file">· {createForm.titre_propriete_propriete.name}</span>}
                    {formErrors.titre_propriete_propriete && <span className="create-error">{formErrors.titre_propriete_propriete}</span>}
                  </div>

                  {/* Résidences */}
                  <div className="create-field">
                    <label className="create-label">Nombre des résidences pour le personnel <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input
                        className={`create-input${formErrors.nombre_residences_personnel ? ' create-input-error' : ''}`}
                        type="number"
                        min="0"
                        value={createForm.nombre_residences_personnel}
                        onChange={(e) => handleCreateChange('nombre_residences_personnel', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    {formErrors.nombre_residences_personnel && <span className="create-error">{formErrors.nombre_residences_personnel}</span>}
                  </div>

                  <div className="create-field">
                    <label className="create-label">Nombre des résidences estudiantines <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input
                        className={`create-input${formErrors.nombre_residences_estudiantines ? ' create-input-error' : ''}`}
                        type="number"
                        min="0"
                        value={createForm.nombre_residences_estudiantines}
                        onChange={(e) => handleCreateChange('nombre_residences_estudiantines', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    {formErrors.nombre_residences_estudiantines && <span className="create-error">{formErrors.nombre_residences_estudiantines}</span>}
                  </div>

                  {/* Est locataire */}
                  <div className="create-field col-full">
                    <label className="create-label">L'établissement est locataire ? <span className="create-required">*</span></label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="est_locataire" checked={createForm.est_locataire === true} onChange={() => handleCreateChange('est_locataire', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="est_locataire" checked={createForm.est_locataire === false} onChange={() => handleCreateChange('est_locataire', false)} /> Non</label>
                    </div>
                    {formErrors.est_locataire && <span className="create-error">{formErrors.est_locataire}</span>}
                  </div>

                  {/* Biens sans titre foncier — textarea, full width */}
                  <div className="create-field col-full">
                    <label className="create-label">Certaines propriétés ne sont pas couvertes par un titre foncier ? si oui, lesquelles ? <span className="create-required">*</span></label>
                    <div className="create-input-wrap create-textarea-wrap">
                      <textarea
                        className={`create-input create-textarea${formErrors.biens_sans_titre_foncier ? ' create-input-error' : ''}`}
                        value={createForm.biens_sans_titre_foncier}
                        onChange={(e) => handleCreateChange('biens_sans_titre_foncier', e.target.value)}
                        placeholder="Description des biens sans titre foncier…"
                        rows={3}
                      />
                    </div>
                    {formErrors.biens_sans_titre_foncier && <span className="create-error">{formErrors.biens_sans_titre_foncier}</span>}
                  </div>

                  {/* Responsable patrimoine nom */}
                  <div className="create-field">
                    <label className="create-label">Responsable patrimoine — Nom <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input
                        className={`create-input${formErrors.responsable_patrimoine_nom ? ' create-input-error' : ''}`}
                        value={createForm.responsable_patrimoine_nom}
                        onChange={(e) => handleCreateChange('responsable_patrimoine_nom', e.target.value)}
                        placeholder="Nom du responsable"
                      />
                    </div>
                    {formErrors.responsable_patrimoine_nom && <span className="create-error">{formErrors.responsable_patrimoine_nom}</span>}
                  </div>

                  {/* Responsable patrimoine téléphone */}
                  <div className="create-field">
                    <label className="create-label">Téléphone du responsable patrimoine <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      <input
                        className={`create-input${formErrors.responsable_patrimoine_telephone ? ' create-input-error' : ''}`}
                        value={createForm.responsable_patrimoine_telephone}
                        onChange={(e) => handleCreateChange('responsable_patrimoine_telephone', e.target.value)}
                        placeholder="+243 …"
                      />
                    </div>
                    {formErrors.responsable_patrimoine_telephone && <span className="create-error">{formErrors.responsable_patrimoine_telephone}</span>}
                  </div>

                  {/* Responsable patrimoine email */}
                  <div className="create-field">
                    <label className="create-label">Email du responsable patrimoine <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input
                        type="email"
                        className={`create-input${formErrors.responsable_patrimoine_email ? ' create-input-error' : ''}`}
                        value={createForm.responsable_patrimoine_email}
                        onChange={(e) => handleCreateChange('responsable_patrimoine_email', e.target.value)}
                        placeholder="patrimoine@etab.cd"
                      />
                    </div>
                    {formErrors.responsable_patrimoine_email && <span className="create-error">{formErrors.responsable_patrimoine_email}</span>}
                  </div>

                </div>
              </div>)}

              {/* ─── Section 8 : Organisation et gestion ─── */}
              {createStep === 8 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">8</div>
                  <div>
                    <h2 className="create-section-title">Organisation et gestion</h2>
                    <p className="create-section-desc">Organigramme et audit interne</p>
                  </div>
                </div>

                <div className="create-grid">

                  {/* Organigramme existe */}
                  <div className="create-field col-full">
                    <label className="create-label">Existence d'un cadre organique/organigramme approuvé par la tutelle ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="organigramme_existe" checked={createForm.organigramme_existe === true} onChange={() => handleCreateChange('organigramme_existe', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="organigramme_existe" checked={createForm.organigramme_existe === false} onChange={() => handleCreateChange('organigramme_existe', false)} /> Non</label>
                    </div>
                  </div>

                  {/* Organigramme fichier */}
                  {createForm.organigramme_existe && (
                    <div className="create-field col-full">
                      <label className="create-label">Fichier organigramme</label>
                      <input
                        type="file"
                        className="create-file-input"
                        onChange={(e) => handleCreateChange('organigramme_fichier', e.target.files?.[0] || null)}
                      />
                      {createForm.organigramme_fichier && <span className="create-doc-file">· {createForm.organigramme_fichier.name}</span>}
                    </div>
                  )}

                  {/* Audit interne */}
                  <div className="create-field col-full">
                    <label className="create-label">Existence d'un mécanisme d'audit interne ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="audit_interne" checked={createForm.audit_interne === true} onChange={() => handleCreateChange('audit_interne', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="audit_interne" checked={createForm.audit_interne === false} onChange={() => handleCreateChange('audit_interne', false)} /> Non</label>
                    </div>
                  </div>

                </div>
              </div>)}

              {/* ─── Section 9 : Contrôles et suivi ─── */}
              {createStep === 9 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">9</div>
                  <div>
                    <h2 className="create-section-title">Contrôles et suivi</h2>
                    <p className="create-section-desc">Dates des derniers contrôles effectués</p>
                  </div>
                </div>

                <div className="create-grid">

                  <div className="create-field">
                    <label className="create-label">Date du dernier contrôle viabilité</label>
                    <div className="create-input-wrap">
                      <input
                        type="date"
                        className="create-input create-input-no-icon"
                        value={createForm.date_dernier_controle_viabilite}
                        onChange={(e) => handleCreateChange('date_dernier_controle_viabilite', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="create-field">
                    <label className="create-label">Date du dernier contrôle gestion</label>
                    <div className="create-input-wrap">
                      <input
                        type="date"
                        className="create-input create-input-no-icon"
                        value={createForm.date_dernier_controle_gestion}
                        onChange={(e) => handleCreateChange('date_dernier_controle_gestion', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="create-field">
                    <label className="create-label">Date du dernier contrôle scolarité</label>
                    <div className="create-input-wrap">
                      <input
                        type="date"
                        className="create-input create-input-no-icon"
                        value={createForm.date_dernier_controle_scolarite}
                        onChange={(e) => handleCreateChange('date_dernier_controle_scolarite', e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              </div>)}

              {/* ─── Section 10 : École doctorale ─── */}
              {createStep === 10 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">10</div>
                  <div>
                    <h2 className="create-section-title">École doctorale</h2>
                    <p className="create-section-desc">Existence et acte de l'école doctorale</p>
                  </div>
                </div>

                <div className="create-grid">

                  <div className="create-field col-full">
                    <label className="create-label">Organise une école doctorale ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="ecole_doctorale" checked={createForm.ecole_doctorale === true} onChange={() => handleCreateChange('ecole_doctorale', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="ecole_doctorale" checked={createForm.ecole_doctorale === false} onChange={() => handleCreateChange('ecole_doctorale', false)} /> Non</label>
                    </div>
                  </div>

                  {createForm.ecole_doctorale && (
                    <div className="create-field col-full">
                      <label className="create-label">Textes juridiques de création / Autorisation de l'école (pièce jointe PDF)</label>
                      <input
                        type="file"
                        className="create-file-input"
                        onChange={(e) => handleCreateChange('acte_ecole_doctorale', e.target.files?.[0] || null)}
                      />
                      {createForm.acte_ecole_doctorale && <span className="create-doc-file">· {createForm.acte_ecole_doctorale.name}</span>}
                    </div>
                  )}

                </div>
              </div>)}

              {/* ─── Section 11 : Marchés Publics ─── */}
              {createStep === 11 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">11</div>
                  <div>
                    <h2 className="create-section-title">Marchés Publics</h2>
                    <p className="create-section-desc">Existence d'une cellule de gestion des projets et des marchés publics ?</p>
                  </div>
                </div>

                <div className="create-grid">

                  <div className="create-field col-full">
                    <label className="create-label">Cellule marchés publics en place ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="cellule_marches_publics" checked={createForm.cellule_marches_publics === true} onChange={() => handleCreateChange('cellule_marches_publics', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="cellule_marches_publics" checked={createForm.cellule_marches_publics === false} onChange={() => handleCreateChange('cellule_marches_publics', false)} /> Non</label>
                    </div>
                  </div>

                  {createForm.cellule_marches_publics && (
                    <>
                      {/* liste des membres */}
                      {createForm.marches_publics.length > 0 && (
                        <ul className="create-doc-list col-full">
                          {createForm.marches_publics.map((m, i) => (
                            <li key={i} className="create-doc-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{color:'var(--blue-400)',flexShrink:0}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              <span className="create-doc-name">{m.nom}</span>
                              {m.telephone && <span className="create-doc-badge">{m.telephone}</span>}
                              <button type="button" className="create-doc-remove" onClick={() => removeMembreMarche(i)} title="Retirer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {formErrors.marches_publics && (
                        <div className="create-field col-full">
                          <span className="create-error">{formErrors.marches_publics}</span>
                        </div>
                      )}

                      {/* formulaire ajout membre */}
                      <div className="create-field">
                        <label className="create-label">Nom du membre <span className="create-required">*</span></label>
                        <div className="create-input-wrap">
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <input
                            className={`create-input${formErrors.marche_nom ? ' create-input-error' : ''}`}
                            value={marcheForm.nom}
                            onChange={(e) => handleMarcheFormChange('nom', e.target.value)}
                            placeholder="Jean Mukendi"
                          />
                        </div>
                        {formErrors.marche_nom && <span className="create-error">{formErrors.marche_nom}</span>}
                      </div>

                      <div className="create-field">
                        <label className="create-label">Téléphone <span className="create-required">*</span></label>
                        <div className="create-input-wrap">
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                          <input
                            className={`create-input${formErrors.marche_telephone ? ' create-input-error' : ''}`}
                            value={marcheForm.telephone}
                            onChange={(e) => handleMarcheFormChange('telephone', e.target.value)}
                            placeholder="+243…"
                          />
                        </div>
                        {formErrors.marche_telephone && <span className="create-error">{formErrors.marche_telephone}</span>}
                      </div>

                      <div className="create-field">
                        <label className="create-label">Email <span className="create-required">*</span></label>
                        <div className="create-input-wrap">
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          <input
                            className={`create-input${formErrors.marche_email ? ' create-input-error' : ''}`}
                            type="email"
                            value={marcheForm.email}
                            onChange={(e) => handleMarcheFormChange('email', e.target.value)}
                            placeholder="exemple@domaine.com"
                          />
                        </div>
                        {formErrors.marche_email && <span className="create-error">{formErrors.marche_email}</span>}
                      </div>

                      <div className="create-field" style={{alignSelf:'flex-end'}}>
                        <button type="button" className="create-btn-doc-add" onClick={addMembreMarche}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Ajouter membre
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>)}

              {createStep === 12 && (<div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">12</div>
                  <div>
                    <h2 className="create-section-title">Soumissionnaire</h2>
                    <p className="create-section-desc">Personne qui soumet cette fiche d'identification</p>
                  </div>
                </div>

                <div className="create-grid">

                  <div className="create-field col-full">
                    <label className="create-label">Nom complet <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input
                        className={`create-input${formErrors.soumissionnaire_nom ? ' create-input-error' : ''}`}
                        value={createForm.soumissionnaire_nom}
                        onChange={(e) => handleCreateChange('soumissionnaire_nom', e.target.value)}
                        placeholder="Jean Mukendi"
                      />
                    </div>
                    {formErrors.soumissionnaire_nom && <span className="create-error-msg">{formErrors.soumissionnaire_nom}</span>}
                  </div>

                  <div className="create-field">
                    <label className="create-label">Adresse e-mail <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input
                        type="email"
                        className={`create-input${formErrors.soumissionnaire_email ? ' create-input-error' : ''}`}
                        value={createForm.soumissionnaire_email}
                        onChange={(e) => handleCreateChange('soumissionnaire_email', e.target.value)}
                        placeholder="jean.mukendi@email.com"
                      />
                    </div>
                    {formErrors.soumissionnaire_email && <span className="create-error-msg">{formErrors.soumissionnaire_email}</span>}
                  </div>

                  <div className="create-field">
                    <label className="create-label">Téléphone <span className="create-required">*</span></label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.73 9.7 19.79 19.79 0 01.67 1.1 2 2 0 012.65 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.64a16 16 0 006.29 6.29l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      <input
                        type="tel"
                        className={`create-input${formErrors.soumissionnaire_telephone ? ' create-input-error' : ''}`}
                        value={createForm.soumissionnaire_telephone}
                        onChange={(e) => handleCreateChange('soumissionnaire_telephone', e.target.value)}
                        placeholder="+243812345678"
                      />
                    </div>
                    {formErrors.soumissionnaire_telephone && <span className="create-error-msg">{formErrors.soumissionnaire_telephone}</span>}
                  </div>

                </div>
              </div>)}

              {/* ─── Navigation étapes ─── */}
              <div className="create-actions">
                <button type="button" className="create-btn-cancel" onClick={() => setView('map')}>
                  Annuler
                </button>
                <div style={{display:'flex', gap:'0.5rem', marginLeft:'auto'}}>
                  {createStep > 1 && (
                    <button type="button" className="create-btn-prev" onClick={() => setCreateStep((s) => s - 1)}>
                      ← Précédent
                    </button>
                  )}
                  {createStep < CREATE_STEPS[CREATE_STEPS.length - 1].num ? (
                    <button type="button" className="create-btn-next" onClick={goToNextCreateStep}>
                      Suivant →
                    </button>
                  ) : (
                    <button type="button" className="create-btn-submit" disabled={saving} onClick={handleCreateSubmit}>
                      {saving
                        ? <><span className="spinner" /> Envoi en cours…</>
                        : <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                            Créer l'établissement
                          </>
                      }
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════
          VUE DÉTAIL
      ══════════════════════════════════════════════════ */}
      {view === 'detail' && detailEtab && (
        <main className="detail-main">
          <div className="detail-container">

            {/* En-tête */}
            <div className="detail-header">
              <div className="detail-header-left">
                <div className="detail-avatar">
                  {detailEtab.logo
                    ? <img src={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.logo}`} alt="logo" className="detail-logo-img" />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
                  }
                </div>
                <div>
                  <h1 className="detail-title">{toTitleCase(detailEtab.nom_etablissement)}</h1>
                  <div className="detail-meta">
                    <span className="detail-sigle">{detailEtab.sigle_etablissement}</span>
                    <span className={`badge badge-${detailEtab.statut === 'public' ? 'public' : 'prive'}`}>{detailEtab.statut}</span>
                    <span className="badge" style={{background:'var(--slate-100)',color:'var(--slate-600)'}}>{detailEtab.etat}</span>
                  </div>
                  <p className="detail-code">{detailEtab.code_etablissement}</p>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.5rem',flexShrink:0}}>
                {!detailEditMode && (
                  <button className="detail-edit-btn" onClick={openDetailEdit}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Modifier
                  </button>
                )}
                <button className="detail-close-btn" onClick={() => { setDetailEditMode(false); setView('list'); setDetailEtab(null); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Fermer
                </button>
              </div>
            </div>

            {/* Grille de sections — lecture seule */}
            {!detailEditMode ? (
            <div className="detail-sections">

              {/* 1. Identification */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  Identification
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Statut</span><span>{detailEtab.statut || '—'}</span></div>
                  <div className="detail-row"><span>Prise en charge état</span><span>{detailEtab.pris_en_charge_par_etat ? 'Oui' : 'Non'}</span></div>
                  <div className="detail-row"><span>Date de création</span><span>{detailEtab.date_creation || '—'}</span></div>
                  <div className="detail-row"><span>Email</span><span>{detailEtab.email || '—'}</span></div>
                  <div className="detail-row"><span>Téléphone</span><span>{detailEtab.telephone || '—'}</span></div>
                </div>
                {/* Documents */}
                {(detailEtab.acte_creation || detailEtab.acte_fonctionnement || detailEtab.acte_agrement || detailEtab.acte_prise_en_charge || detailEtab.convention_etat_rdc) && (
                  <div className="detail-docs">
                    {detailEtab.acte_creation && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_creation}`} target="_blank" rel="noreferrer" className="detail-doc-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Acte de création</a>}
                    {detailEtab.acte_fonctionnement && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_fonctionnement}`} target="_blank" rel="noreferrer" className="detail-doc-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Acte de fonctionnement</a>}
                    {detailEtab.acte_agrement && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_agrement}`} target="_blank" rel="noreferrer" className="detail-doc-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Acte d'agrément</a>}
                    {detailEtab.acte_prise_en_charge && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_prise_en_charge}`} target="_blank" rel="noreferrer" className="detail-doc-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Acte prise en charge</a>}
                    {detailEtab.convention_etat_rdc && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.convention_etat_rdc}`} target="_blank" rel="noreferrer" className="detail-doc-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Convention État RDC</a>}
                  </div>
                )}
              </div>

              {/* 2. Localisation */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Localisation
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Province</span><span>{detailEtab.province || '—'}</span></div>
                  <div className="detail-row"><span>Ville / Localité</span><span>{detailEtab.ville_localite || '—'}</span></div>
                  <div className="detail-row"><span>Commune</span><span>{detailEtab.commune || '—'}</span></div>
                  <div className="detail-row"><span>Adresse</span><span>{detailEtab.adresse || '—'}</span></div>
                  <div className="detail-row"><span>Rue / Avenue</span><span>{detailEtab.rue_avenue || '—'}</span></div>
                  <div className="detail-row"><span>Coordonnées GPS</span><span>{detailEtab.latitude && detailEtab.longitude ? `${detailEtab.latitude}, ${detailEtab.longitude}` : '—'}</span></div>
                </div>
              </div>

              {/* 3. Comité de gestion */}
              <div className="detail-card detail-card-full">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  Comité de gestion
                </div>
                <div className="detail-comite-grid">
                  {[
                    { titre: 'Recteur / Directeur', nom: detailEtab.recteur_nom, sexe: detailEtab.recteur_sexe, grade: detailEtab.recteur_grade, tel: detailEtab.recteur_telephone, email: detailEtab.recteur_email, arrete: detailEtab.recteur_arrete, enFonction: detailEtab.recteur_en_fonction, horsFonctionDepuis: detailEtab.recteur_hors_fonction_depuis, horsFonctionMotif: detailEtab.recteur_hors_fonction_motif },
                    { titre: 'Secrétaire Général Académique', nom: detailEtab.sga_nom, sexe: detailEtab.sga_sexe, grade: detailEtab.sga_grade, tel: detailEtab.sga_telephone, email: detailEtab.sga_email, arrete: detailEtab.sga_arrete, enFonction: detailEtab.sga_en_fonction, horsFonctionDepuis: detailEtab.sga_hors_fonction_depuis, horsFonctionMotif: detailEtab.sga_hors_fonction_motif },
                    { titre: 'Administrateur du Budget', nom: detailEtab.ab_nom, sexe: detailEtab.ab_sexe, grade: detailEtab.ab_grade, tel: detailEtab.ab_telephone, email: detailEtab.ab_email, arrete: detailEtab.ab_arrete, enFonction: detailEtab.ab_en_fonction, horsFonctionDepuis: detailEtab.ab_hors_fonction_depuis, horsFonctionMotif: detailEtab.ab_hors_fonction_motif },
                    { titre: 'Secrétaire Général à la Recherche', nom: detailEtab.sgr_nom, sexe: detailEtab.sgr_sexe, grade: detailEtab.sgr_grade, tel: detailEtab.sgr_telephone, email: detailEtab.sgr_email, arrete: detailEtab.sgr_arrete, enFonction: detailEtab.sgr_en_fonction, horsFonctionDepuis: detailEtab.sgr_hors_fonction_depuis, horsFonctionMotif: detailEtab.sgr_hors_fonction_motif },
                  ].map((p) => (
                    <div key={p.titre} className="detail-person-card">
                      <div className="detail-person-title">{p.titre}</div>
                      <div className="detail-rows">
                        <div className="detail-row"><span>Nom</span><span>{p.nom || '—'}</span></div>
                        <div className="detail-row"><span>Sexe</span><span>{p.sexe || '—'}</span></div>
                        <div className="detail-row"><span>Grade</span><span>{p.grade || '—'}</span></div>
                        <div className="detail-row"><span>Téléphone</span><span>{p.tel || '—'}</span></div>
                        <div className="detail-row"><span>Email</span><span>{p.email || '—'}</span></div>
                        {p.enFonction != null && <div className="detail-row"><span>En fonction</span><span style={{color: p.enFonction ? '#16a34a' : '#dc2626', fontWeight:600}}>{p.enFonction ? 'Oui' : 'Non'}</span></div>}
                        {p.enFonction === false && p.horsFonctionDepuis && <div className="detail-row"><span>Hors fonction depuis</span><span>{p.horsFonctionDepuis}</span></div>}
                        {p.enFonction === false && p.horsFonctionMotif && <div className="detail-row"><span>Motif</span><span>{p.horsFonctionMotif}</span></div>}
                      </div>
                      {p.arrete && <a href={`${API_BASE_URL.replace(/\/$/, '')}${p.arrete}`} target="_blank" rel="noreferrer" className="detail-doc-link" style={{marginTop:'0.4rem'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Arrêté de nomination</a>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Ressources humaines */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Ressources humaines
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Total enseignants</span><span>{detailEtab.total_enseignants || '—'}</span></div>
                  <div className="detail-row"><span>Dont femmes</span><span>{detailEtab.enseignants_femmes || '—'}</span></div>
                  <div className="detail-row"><span>Prof. Associés (PA)</span><span>{detailEtab.pa || '—'}</span></div>
                  <div className="detail-row"><span>Professeurs (P)</span><span>{detailEtab.p || '—'}</span></div>
                  <div className="detail-row"><span>Prof. Ordinaires (PO)</span><span>{detailEtab.po || '—'}</span></div>
                  <div className="detail-row detail-row-group-header"><span>Personnel scientifique</span></div>
                  <div className="detail-row"><span>  Chefs des travaux</span><span>{detailEtab.chefs_travaux ?? '—'}</span></div>
                  <div className="detail-row"><span>  Assistants</span><span>{detailEtab.assistants ?? '—'}</span></div>
                  <div className="detail-row"><span>  Chargés de pratiques professionnelles</span><span>{detailEtab.charges_pratiques_professionnelles ?? '—'}</span></div>
                  <div className="detail-row"><span>  Pers. sci. femmes</span><span>{detailEtab.personnel_scientifique_femmes ?? '—'}</span></div>
                  <div className="detail-row detail-row-group-header"><span>Effectif PATO</span></div>
                  <div className="detail-row"><span>  Cadres de commandement</span><span>{detailEtab.cadres_commandement ?? '—'}</span></div>
                  <div className="detail-row"><span>  Cadres de collaboration</span><span>{detailEtab.cadres_collaboration ?? '—'}</span></div>
                  <div className="detail-row"><span>  Agents d’exécution</span><span>{detailEtab.agents_execution ?? '—'}</span></div>
                </div>
              </div>

              {/* 5. Organisation académique */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                  Organisation académique
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Niveaux</span><span>{[detailEtab.licence && 'Licence', detailEtab.master && 'Master', detailEtab.doctorat && 'Doctorat'].filter(Boolean).join(', ') || '—'}</span></div>
                  <div className="detail-row"><span>Autres niveaux</span><span>{detailEtab.autres_niveaux || '—'}</span></div>
                  <div className="detail-row"><span>Effectif Licence</span><span>{detailEtab.effectif_licence_total || '—'}</span></div>
                  <div className="detail-row"><span>Effectif Master</span><span>{detailEtab.effectif_master_total || '—'}</span></div>
                  <div className="detail-row"><span>Effectif Doctorat</span><span>{detailEtab.effectif_doctorat_total || '—'}</span></div>
                  <div className="detail-row"><span>Total étudiants LMD</span><span>{detailEtab.nombre_etudiants_lmd || '—'}</span></div>
                </div>
                {detailEtab.filieres && detailEtab.filieres.length > 0 && (
                  <div style={{marginTop:'0.75rem'}}>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.4rem'}}>Filières</div>
                    {detailEtab.filieres.map((f, i) => (
                      <div key={i} className="detail-filiere-item">
                        <div className="detail-filiere-nom">{f.nom}</div>
                        {f.effectifs && f.effectifs.length > 0 && (
                          <table className="detail-effectif-table">
                            <thead><tr><th>Année</th><th>Total</th><th>M</th><th>F</th></tr></thead>
                            <tbody>
                              {f.effectifs.map((e, j) => (
                                <tr key={j}><td>{e.annee}</td><td>{e.total}</td><td>{e.masculin}</td><td>{e.feminin}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {detailEtab.accords_mobilite && detailEtab.accords_mobilite.length > 0 && (
                  <div style={{marginTop:'0.75rem'}}>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.4rem'}}>Accords de mobilité internationales</div>
                    <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                      {detailEtab.accords_mobilite.map((a, i) => (
                        <li key={i} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.8rem',color:'var(--slate-700)'}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{color:'var(--blue-400)',flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                          {a.accord}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 6. Patrimoine */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  Patrimoine
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Résidences pour le personnel</span><span>{detailEtab.nombre_residences_personnel ?? '—'}</span></div>
                  <div className="detail-row"><span>Résidences estudiantines</span><span>{detailEtab.nombre_residences_estudiantines ?? '—'}</span></div>
                  <div className="detail-row"><span>Est locataire</span><span>{detailEtab.est_locataire ? 'Oui' : 'Non'}</span></div>
                  <div className="detail-row"><span>Biens sans titre foncier</span><span>{detailEtab.biens_sans_titre_foncier || '—'}</span></div>
                  <div className="detail-row"><span>Responsable patrimoine</span><span>{detailEtab.responsable_patrimoine_nom || '—'}</span></div>
                  <div className="detail-row"><span>Tél. responsable</span><span>{detailEtab.responsable_patrimoine_telephone || '—'}</span></div>
                  <div className="detail-row"><span>Email responsable</span><span>{detailEtab.responsable_patrimoine_email || '—'}</span></div>
                </div>
                {detailEtab.titre_propriete_propriete && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.titre_propriete_propriete}`} target="_blank" rel="noreferrer" className="detail-doc-link" style={{marginTop:'0.5rem'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Titre de propriété</a>}
              </div>

              {/* 7. Gestion & Contrôles */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  Gestion &amp; Contrôles
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>Organigramme</span><span>{detailEtab.organigramme_existe ? 'Oui' : 'Non'}</span></div>
                  <div className="detail-row"><span>Audit interne</span><span>{detailEtab.audit_interne ? 'Oui' : 'Non'}</span></div>
                  <div className="detail-row"><span>Contrôle viabilité</span><span>{detailEtab.date_dernier_controle_viabilite || '—'}</span></div>
                  <div className="detail-row"><span>Contrôle gestion</span><span>{detailEtab.date_dernier_controle_gestion || '—'}</span></div>
                  <div className="detail-row"><span>Contrôle scolarité</span><span>{detailEtab.date_dernier_controle_scolarite || '—'}</span></div>
                </div>
                {detailEtab.organigramme_fichier && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.organigramme_fichier}`} target="_blank" rel="noreferrer" className="detail-doc-link" style={{marginTop:'0.5rem'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Organigramme</a>}
              </div>

              {/* 8. École doctorale */}
              <div className="detail-card">
                <div className="detail-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
                  École doctorale
                </div>
                <div className="detail-rows">
                  <div className="detail-row"><span>École doctorale</span><span>{detailEtab.ecole_doctorale ? 'Oui' : 'Non'}</span></div>
                </div>
                {detailEtab.acte_ecole_doctorale && <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_ecole_doctorale}`} target="_blank" rel="noreferrer" className="detail-doc-link" style={{marginTop:'0.5rem'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Textes juridiques de création / Autorisation de l'école</a>}
              </div>

              {/* 9. Marchés publics */}
              {detailEtab.cellule_marches_publics && (
                <div className="detail-card">
                  <div className="detail-card-head">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    Marchés publics
                  </div>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Cellule marchés publics</span><span>Oui</span></div>
                  </div>
                  {detailEtab.marches_publics && detailEtab.marches_publics.length > 0 && (
                    <ul className="detail-marche-list">
                      {detailEtab.marches_publics.map((m, i) => (
                        <li key={i} className="detail-marche-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{color:'var(--blue-400)',flexShrink:0}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span className="detail-marche-nom">{m.nom}</span>
                          {m.telephone && <span className="detail-marche-tel">{m.telephone}</span>}
                          {m.email && <span className="detail-marche-email">{m.email}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 10. Soumissionnaire */}
              {(detailEtab.soumissionnaire_nom || detailEtab.soumissionnaire_email) && (
                <div className="detail-card">
                  <div className="detail-card-head">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Soumissionnaire
                  </div>
                  <div className="detail-rows">
                    <div className="detail-row"><span>Nom</span><span>{detailEtab.soumissionnaire_nom || '—'}</span></div>
                    <div className="detail-row"><span>Email</span><span>{detailEtab.soumissionnaire_email || '—'}</span></div>
                    <div className="detail-row"><span>Téléphone</span><span>{detailEtab.soumissionnaire_telephone || '—'}</span></div>
                  </div>
                </div>
              )}

            </div>
          ) : detailEditForm && (
            /* ── Formulaire d'édition inline ── */
            <form className="create-form detail-edit-form" onSubmit={(e) => e.preventDefault()}>

              {/* 1. Identification */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">1</div>
                  <div><h2 className="create-section-title">Identification</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full">
                    <label className="create-label">Nom de l'établissement</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>
                      <input className="create-input" value={detailEditForm.nom_etablissement} onChange={(e) => handleDetailEditChange('nom_etablissement', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Sigle</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      <input className="create-input" value={detailEditForm.sigle_etablissement} onChange={(e) => handleDetailEditChange('sigle_etablissement', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Statut</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <select className="create-input create-select" value={detailEditForm.statut} onChange={(e) => handleDetailEditChange('statut', e.target.value)}>
                        <option value="public">Public</option>
                        <option value="prive">Privé</option>
                      </select>
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">État</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      <select className="create-input create-select" value={detailEditForm.etat} onChange={(e) => handleDetailEditChange('etat', e.target.value)}>
                        <option value="soumis">Soumis</option>
                        <option value="valide">Validé</option>
                        <option value="rejete">Rejeté</option>
                      </select>
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Date de création</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <input type="date" className="create-input" value={detailEditForm.date_creation} onChange={(e) => handleDetailEditChange('date_creation', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Email</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input type="email" className="create-input" value={detailEditForm.email} onChange={(e) => handleDetailEditChange('email', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Téléphone</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      <input className="create-input" value={detailEditForm.telephone} onChange={(e) => handleDetailEditChange('telephone', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field col-full">
                    <label className="create-label">Pris en charge par l'État ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_pris_en_charge_par_etat" checked={detailEditForm.pris_en_charge_par_etat === true} onChange={() => handleDetailEditChange('pris_en_charge_par_etat', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_pris_en_charge_par_etat" checked={detailEditForm.pris_en_charge_par_etat === false} onChange={() => handleDetailEditChange('pris_en_charge_par_etat', false)} /> Non</label>
                    </div>
                  </div>

                  {/* ─── Fichiers Identification ─── */}
                  {[
                    ['logo', 'Logo', 'image/*'],
                    ['convention_etat_rdc', 'Convention État (RDC)', null],
                    ['acte_creation', 'Acte de création', null],
                    ['acte_fonctionnement', 'Acte de fonctionnement', null],
                    ['acte_agrement', "Acte d'agrément", null],
                  ].map(([field, lbl, accept]) => (
                    <div className="create-field" key={field}>
                      <label className="create-label">{lbl}</label>
                      <div className="detail-file-field">
                        {detailEtab[field] && !detailEditFiles[field] && (
                          <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab[field]}`} target="_blank" rel="noreferrer" className="detail-file-current">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Fichier actuel
                          </a>
                        )}
                        {detailEditFiles[field] && <span className="detail-file-new">✓ {detailEditFiles[field].name}</span>}
                        <label className="detail-file-replace-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {detailEditFiles[field] ? 'Changer' : (detailEtab[field] ? 'Remplacer' : 'Choisir')}
                          <input type="file" accept={accept || undefined} style={{display:'none'}} onChange={(e) => handleDetailEditFileChange(field, e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>
                  ))}
                  {detailEditForm.pris_en_charge_par_etat && (
                    <div className="create-field">
                      <label className="create-label">Acte de prise en charge</label>
                      <div className="detail-file-field">
                        {detailEtab.acte_prise_en_charge && !detailEditFiles.acte_prise_en_charge && (
                          <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_prise_en_charge}`} target="_blank" rel="noreferrer" className="detail-file-current">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Fichier actuel
                          </a>
                        )}
                        {detailEditFiles.acte_prise_en_charge && <span className="detail-file-new">✓ {detailEditFiles.acte_prise_en_charge.name}</span>}
                        <label className="detail-file-replace-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {detailEditFiles.acte_prise_en_charge ? 'Changer' : (detailEtab.acte_prise_en_charge ? 'Remplacer' : 'Choisir')}
                          <input type="file" style={{display:'none'}} onChange={(e) => handleDetailEditFileChange('acte_prise_en_charge', e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Localisation */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">2</div>
                  <div><h2 className="create-section-title">Localisation &amp; Contact</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full">
                    <label className="create-label">Adresse</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input className="create-input" value={detailEditForm.adresse} onChange={(e) => handleDetailEditChange('adresse', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Rue / Avenue</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                      <input className="create-input" value={detailEditForm.rue_avenue} onChange={(e) => handleDetailEditChange('rue_avenue', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Commune</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <input className="create-input" value={detailEditForm.commune} onChange={(e) => handleDetailEditChange('commune', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Ville / Localité</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <input className="create-input" value={detailEditForm.ville_localite} onChange={(e) => handleDetailEditChange('ville_localite', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Province</label>
                    <ProvinceDropdown required value={detailEditForm.province} onChange={(v) => handleDetailEditChange('province', v)} active={!!detailEditForm.province} placeholder="Sélectionner une province" />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Latitude</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                      <input type="number" step="any" className="create-input" value={detailEditForm.latitude} onChange={(e) => handleDetailEditChange('latitude', e.target.value)} />
                    </div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Longitude</label>
                    <div className="create-input-wrap">
                      <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                      <input type="number" step="any" className="create-input" value={detailEditForm.longitude} onChange={(e) => handleDetailEditChange('longitude', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Comité de gestion */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">3</div>
                  <div><h2 className="create-section-title">Comité de gestion</h2></div>
                </div>
                {[
                  { label: 'Recteur / Directeur', prefix: 'recteur' },
                  { label: 'Secrétaire Général Académique', prefix: 'sga' },
                  { label: 'Administrateur du Budget', prefix: 'ab' },
                  { label: 'Secrétaire Général à la Recherche', prefix: 'sgr' },
                ].map(({ label, prefix }) => (
                  <div key={prefix} style={{marginBottom:'1.2rem'}}>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--blue-600)',textTransform:'uppercase',letterSpacing:'0.06em',padding:'0.8rem 1.25rem 0.3rem',borderBottom:'1px solid var(--slate-200)'}}>{label}</div>
                    <div className="create-grid">
                      <div className="create-field">
                        <label className="create-label">Nom</label>
                        <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input className="create-input" value={detailEditForm[`${prefix}_nom`]} onChange={(e) => handleDetailEditChange(`${prefix}_nom`, e.target.value)} /></div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Sexe</label>
                        <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg><select className="create-input create-select" value={detailEditForm[`${prefix}_sexe`]} onChange={(e) => handleDetailEditChange(`${prefix}_sexe`, e.target.value)}><option value="">—</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Grade</label>
                        <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/></svg><input className="create-input" value={detailEditForm[`${prefix}_grade`]} onChange={(e) => handleDetailEditChange(`${prefix}_grade`, e.target.value)} /></div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Téléphone</label>
                        <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81"/></svg><input className="create-input" value={detailEditForm[`${prefix}_telephone`]} onChange={(e) => handleDetailEditChange(`${prefix}_telephone`, e.target.value)} /></div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Email</label>
                        <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" className="create-input" value={detailEditForm[`${prefix}_email`]} onChange={(e) => handleDetailEditChange(`${prefix}_email`, e.target.value)} /></div>
                      </div>
                      <div className="create-field">
                        <label className="create-label">Arrêté de nomination</label>
                        <div className="detail-file-field">
                          {detailEtab[`${prefix}_arrete`] && !detailEditFiles[`${prefix}_arrete`] && (
                            <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab[`${prefix}_arrete`]}`} target="_blank" rel="noreferrer" className="detail-file-current">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              Fichier actuel
                            </a>
                          )}
                          {detailEditFiles[`${prefix}_arrete`] && <span className="detail-file-new">✓ {detailEditFiles[`${prefix}_arrete`].name}</span>}
                          <label className="detail-file-replace-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            {detailEditFiles[`${prefix}_arrete`] ? 'Changer' : (detailEtab[`${prefix}_arrete`] ? 'Remplacer' : 'Choisir')}
                            <input type="file" style={{display:'none'}} onChange={(e) => handleDetailEditFileChange(`${prefix}_arrete`, e.target.files?.[0])} />
                          </label>
                        </div>
                      </div>
                      {(prefix === 'recteur' || prefix === 'sga' || prefix === 'ab' || prefix === 'sgr') && (
                        <>
                          <div className="create-field col-full">
                            <label className="create-label">En fonction ?</label>
                            <div style={{display:'flex',gap:'1.5rem'}}>
                              <label className="create-label-checkbox"><input type="radio" name={`${prefix}_en_fonction`} checked={detailEditForm[`${prefix}_en_fonction`] === true} onChange={() => handleDetailEditChange(`${prefix}_en_fonction`, true)} /> Oui</label>
                              <label className="create-label-checkbox"><input type="radio" name={`${prefix}_en_fonction`} checked={detailEditForm[`${prefix}_en_fonction`] === false} onChange={() => handleDetailEditChange(`${prefix}_en_fonction`, false)} /> Non</label>
                            </div>
                          </div>
                          {detailEditForm[`${prefix}_en_fonction`] === false && (
                            <>
                              <div className="create-field">
                                <label className="create-label">Hors fonction depuis</label>
                                <input type="date" required className="create-input create-input-no-icon" value={detailEditForm[`${prefix}_hors_fonction_depuis`]} onChange={(e) => handleDetailEditChange(`${prefix}_hors_fonction_depuis`, e.target.value)} />
                              </div>
                              <div className="create-field">
                                <label className="create-label">Motif</label>
                                <input required className="create-input create-input-no-icon" value={detailEditForm[`${prefix}_hors_fonction_motif`]} onChange={(e) => handleDetailEditChange(`${prefix}_hors_fonction_motif`, e.target.value)} placeholder="Ex : démission…" />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Ressources humaines */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">4</div>
                  <div><h2 className="create-section-title">Ressources humaines</h2></div>
                </div>
                <div className="create-grid">
                  {[
                    ['total_enseignants','Total enseignants'],['pa','Prof. Associés (PA)'],['p','Professeurs (P)'],['po','Prof. Ordinaires (PO)'],
                    ['enseignants_femmes','Dont femmes'],
                  ].map(([field, lbl]) => (
                    <div className="create-field" key={field}>
                      <label className="create-label">{lbl}</label>
                      <input type="number" min="0" className="create-input create-input-no-icon" value={detailEditForm[field]} onChange={(e) => handleDetailEditChange(field, e.target.value)} />
                    </div>
                  ))}
                  <div className="create-field col-full create-group-header"><span className="create-group-label">Personnel scientifique</span></div>
                  {[
                    ['chefs_travaux','Chefs des travaux'],['assistants','Assistants'],
                    ['charges_pratiques_professionnelles','Chargés de pratiques professionnelles'],
                    ['personnel_scientifique_femmes','Pers. sci. femmes'],
                  ].map(([field, lbl]) => (
                    <div className="create-field" key={field}>
                      <label className="create-label">{lbl}</label>
                      <input type="number" min="0" className="create-input create-input-no-icon" value={detailEditForm[field]} onChange={(e) => handleDetailEditChange(field, e.target.value)} />
                    </div>
                  ))}
                  <div className="create-field col-full create-group-header"><span className="create-group-label">Effectif PATO</span></div>
                  {[
                    ['cadres_commandement','Cadres de commandement'],
                    ['cadres_collaboration','Cadres de collaboration'],
                    ['agents_execution','Agents d’exécution'],
                  ].map(([field, lbl]) => (
                    <div className="create-field" key={field}>
                      <label className="create-label">{lbl}</label>
                      <input type="number" min="0" className="create-input create-input-no-icon" value={detailEditForm[field]} onChange={(e) => handleDetailEditChange(field, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Organisation académique */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">5</div>
                  <div><h2 className="create-section-title">Organisation académique</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full" style={{display:'flex',gap:'1.5rem'}}>
                    {[['licence','Licence'],['master','Master'],['doctorat','Doctorat']].map(([f,l]) => (
                      <label key={f} className="create-label create-label-checkbox">
                        <input type="checkbox" className="create-checkbox" checked={detailEditForm[f]} onChange={(e) => handleDetailEditChange(f, e.target.checked)} />{l}
                      </label>
                    ))}
                  </div>
                  <div className="create-field col-full">
                    <label className="create-label">Autres niveaux</label>
                    <input className="create-input create-input-no-icon" value={detailEditForm.autres_niveaux} onChange={(e) => handleDetailEditChange('autres_niveaux', e.target.value)} />
                  </div>
                  {[['effectif_licence_total','Effectif Licence'],['effectif_master_total','Effectif Master'],['effectif_doctorat_total','Effectif Doctorat'],['nombre_etudiants_lmd','Total étudiants LMD']].map(([f,l]) => (
                    <div className="create-field" key={f}>
                      <label className="create-label">{l}</label>
                      <input type="number" min="0" className="create-input create-input-no-icon" value={detailEditForm[f]} onChange={(e) => handleDetailEditChange(f, e.target.value)} />
                    </div>
                  ))}
                {/* Filières */}
                <div className="create-field col-full edit-filieres-block">
                  <div className="edit-filieres-label">Filières</div>
                  {detailEditForm.filieres.map((f, i) => (
                    <div key={i} className="edit-filiere-card">
                      <div className="edit-filiere-card-header">
                        <div className="create-input-wrap" style={{flex:1}}>
                          <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                          <input className="create-input" value={f.nom} onChange={(e) => handleDetailEditFiliereChange(i, 'nom', e.target.value)} placeholder="Nom de la filière" />
                        </div>
                        <button type="button" className="edit-filiere-remove-btn" title="Supprimer" onClick={() => removeDetailEditFiliere(i)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      {f.effectifs && f.effectifs.length > 0 && (
                        <table className="edit-filiere-table">
                          <thead>
                            <tr>
                              <th>Année</th><th>Total</th><th>Masc.</th><th>Fém.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.effectifs.map((e, j) => (
                              <tr key={j}>
                                <td>{e.annee}</td>
                                <td>{e.total}</td>
                                <td>{e.masculin}</td>
                                <td>{e.feminin}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                  <button type="button" className="edit-filiere-add-btn" onClick={addDetailEditFiliere}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter une filière
                  </button>
                </div>

                {/* Accords de mobilités internationales */}
                <div className="create-field col-full edit-filieres-block">
                  <div className="edit-filieres-label">Accords de mobilité internationale des étudiants</div>
                  {detailEditForm.accords_mobilite.map((a, i) => (
                    <div key={i} style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.4rem'}}>
                      <div className="create-input-wrap" style={{flex:1}}>
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        <input className="create-input" value={a.accord} onChange={(e) => handleDetailEditAccordChange(i, e.target.value)} placeholder="Nom de l'accord" />
                      </div>
                      <button type="button" className="edit-filiere-remove-btn" title="Supprimer" onClick={() => removeDetailEditAccord(i)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" className="edit-filiere-add-btn" onClick={addDetailEditAccord}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter un accord
                  </button>
                </div>

                </div>{/* /create-grid */}
              </div>{/* /section 5 */}

              {/* 6. Patrimoine */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">6</div>
                  <div><h2 className="create-section-title">Patrimoine</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field">
                    <label className="create-label">Nombre des résidences pour le personnel</label>
                    <input className="create-input create-input-no-icon" type="number" min="0" value={detailEditForm.nombre_residences_personnel} onChange={(e) => handleDetailEditChange('nombre_residences_personnel', e.target.value)} placeholder="0" />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Nombre des résidences estudiantines</label>
                    <input className="create-input create-input-no-icon" type="number" min="0" value={detailEditForm.nombre_residences_estudiantines} onChange={(e) => handleDetailEditChange('nombre_residences_estudiantines', e.target.value)} placeholder="0" />
                  </div>
                  <div className="create-field col-full">
                    <label className="create-label">L'établissement est locataire ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_est_locataire" checked={detailEditForm.est_locataire === true} onChange={() => handleDetailEditChange('est_locataire', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_est_locataire" checked={detailEditForm.est_locataire === false} onChange={() => handleDetailEditChange('est_locataire', false)} /> Non</label>
                    </div>
                  </div>
                  <div className="create-field col-full">
                    <label className="create-label">Biens sans titre foncier</label>
                    <input className="create-input create-input-no-icon" value={detailEditForm.biens_sans_titre_foncier} onChange={(e) => handleDetailEditChange('biens_sans_titre_foncier', e.target.value)} />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Responsable patrimoine</label>
                    <input className="create-input create-input-no-icon" value={detailEditForm.responsable_patrimoine_nom} onChange={(e) => handleDetailEditChange('responsable_patrimoine_nom', e.target.value)} />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Tél. responsable</label>
                    <input className="create-input create-input-no-icon" value={detailEditForm.responsable_patrimoine_telephone} onChange={(e) => handleDetailEditChange('responsable_patrimoine_telephone', e.target.value)} />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Email responsable</label>
                    <input type="email" className="create-input create-input-no-icon" value={detailEditForm.responsable_patrimoine_email} onChange={(e) => handleDetailEditChange('responsable_patrimoine_email', e.target.value)} />
                  </div>
                  <div className="create-field">
                    <label className="create-label">Titre de propriété</label>
                    <div className="detail-file-field">
                      {detailEtab.titre_propriete_propriete && !detailEditFiles.titre_propriete_propriete && (
                        <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.titre_propriete_propriete}`} target="_blank" rel="noreferrer" className="detail-file-current">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Fichier actuel
                        </a>
                      )}
                      {detailEditFiles.titre_propriete_propriete && <span className="detail-file-new">✓ {detailEditFiles.titre_propriete_propriete.name}</span>}
                      <label className="detail-file-replace-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {detailEditFiles.titre_propriete_propriete ? 'Changer' : (detailEtab.titre_propriete_propriete ? 'Remplacer' : 'Choisir')}
                        <input type="file" style={{display:'none'}} onChange={(e) => handleDetailEditFileChange('titre_propriete_propriete', e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Gestion & Contrôles */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">7</div>
                  <div><h2 className="create-section-title">Gestion &amp; Contrôles</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full">
                    <label className="create-label">Existence d'un cadre organique/organigramme approuvé par la tutelle ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_organigramme_existe" checked={detailEditForm.organigramme_existe === true} onChange={() => handleDetailEditChange('organigramme_existe', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_organigramme_existe" checked={detailEditForm.organigramme_existe === false} onChange={() => handleDetailEditChange('organigramme_existe', false)} /> Non</label>
                    </div>
                  </div>
                  <div className="create-field col-full">
                    <label className="create-label">Existence d'un mécanisme d'audit interne ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_audit_interne" checked={detailEditForm.audit_interne === true} onChange={() => handleDetailEditChange('audit_interne', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_audit_interne" checked={detailEditForm.audit_interne === false} onChange={() => handleDetailEditChange('audit_interne', false)} /> Non</label>
                    </div>
                  </div>
                  {[['date_dernier_controle_viabilite','Dernier contrôle viabilité'],['date_dernier_controle_gestion','Dernier contrôle gestion'],['date_dernier_controle_scolarite','Dernier contrôle scolarité']].map(([f,l]) => (
                    <div className="create-field" key={f}>
                      <label className="create-label">{l}</label>
                      <div className="create-input-wrap">
                        <svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <input type="date" className="create-input" value={detailEditForm[f]} onChange={(e) => handleDetailEditChange(f, e.target.value)} />
                      </div>
                    </div>
                  ))}
                  {detailEditForm.organigramme_existe && (
                    <div className="create-field">
                      <label className="create-label">Organigramme (fichier)</label>
                      <div className="detail-file-field">
                        {detailEtab.organigramme_fichier && !detailEditFiles.organigramme_fichier && (
                          <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.organigramme_fichier}`} target="_blank" rel="noreferrer" className="detail-file-current">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Fichier actuel
                          </a>
                        )}
                        {detailEditFiles.organigramme_fichier && <span className="detail-file-new">✓ {detailEditFiles.organigramme_fichier.name}</span>}
                        <label className="detail-file-replace-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {detailEditFiles.organigramme_fichier ? 'Changer' : (detailEtab.organigramme_fichier ? 'Remplacer' : 'Choisir')}
                          <input type="file" style={{display:'none'}} onChange={(e) => handleDetailEditFileChange('organigramme_fichier', e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. École doctorale */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">8</div>
                  <div><h2 className="create-section-title">École doctorale</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full">
                    <label className="create-label">Organise une école doctorale ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_ecole_doctorale" checked={detailEditForm.ecole_doctorale === true} onChange={() => handleDetailEditChange('ecole_doctorale', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_ecole_doctorale" checked={detailEditForm.ecole_doctorale === false} onChange={() => handleDetailEditChange('ecole_doctorale', false)} /> Non</label>
                    </div>
                  </div>
                  {detailEditForm.ecole_doctorale && (
                    <div className="create-field">
                      <label className="create-label">Textes juridiques de création / Autorisation de l'école (pièce jointe PDF)</label>
                      <div className="detail-file-field">
                        {detailEtab.acte_ecole_doctorale && !detailEditFiles.acte_ecole_doctorale && (
                          <a href={`${API_BASE_URL.replace(/\/$/, '')}${detailEtab.acte_ecole_doctorale}`} target="_blank" rel="noreferrer" className="detail-file-current">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Fichier actuel
                          </a>
                        )}
                        {detailEditFiles.acte_ecole_doctorale && <span className="detail-file-new">✓ {detailEditFiles.acte_ecole_doctorale.name}</span>}
                        <label className="detail-file-replace-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {detailEditFiles.acte_ecole_doctorale ? 'Changer' : (detailEtab.acte_ecole_doctorale ? 'Remplacer' : 'Choisir')}
                          <input type="file" style={{display:'none'}} onChange={(e) => handleDetailEditFileChange('acte_ecole_doctorale', e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 9. Marchés publics */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">9</div>
                  <div><h2 className="create-section-title">Marchés publics</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field col-full">
                    <label className="create-label">Cellule marchés publics en place ?</label>
                    <div style={{display:'flex',gap:'1.5rem',marginTop:'0.3rem'}}>
                      <label className="create-label-checkbox"><input type="radio" name="edit_cellule_marches_publics" checked={detailEditForm.cellule_marches_publics === true} onChange={() => handleDetailEditChange('cellule_marches_publics', true)} /> Oui</label>
                      <label className="create-label-checkbox"><input type="radio" name="edit_cellule_marches_publics" checked={detailEditForm.cellule_marches_publics === false} onChange={() => handleDetailEditChange('cellule_marches_publics', false)} /> Non</label>
                    </div>
                  </div>
                </div>
                {detailEditForm.cellule_marches_publics && (
                  <div style={{marginTop:'0.75rem', padding:'0.75rem 1rem', background:'var(--bg-secondary, #f9fafb)', borderRadius:'8px', border:'1px solid var(--border-color, #e5e7eb)'}}>
                    {detailEditForm.marches_publics.map((m, i) => (
                      <div key={i} className="marche-row" style={{display:'flex',gap:'0.75rem',alignItems:'center',marginBottom:'0.6rem', flexWrap:'wrap'}}>
                        <input className="create-input create-input-no-icon" style={{flex:'2 1 160px'}} value={m.nom} onChange={(e) => handleDetailEditMarcheChange(i, 'nom', e.target.value)} placeholder="Nom du responsable" />
                        <input className="create-input create-input-no-icon" style={{flex:'1 1 120px'}} value={m.telephone} onChange={(e) => handleDetailEditMarcheChange(i, 'telephone', e.target.value)} placeholder="Téléphone" />
                        <input className="create-input create-input-no-icon" style={{flex:'2 1 160px'}} type="email" value={m.email || ''} onChange={(e) => handleDetailEditMarcheChange(i, 'email', e.target.value)} placeholder="Email" />
                        <button type="button" className="create-btn-remove" onClick={() => removeDetailEditMarche(i)}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="create-btn-add-marche" onClick={addDetailEditMarche}>+ Ajouter un responsable</button>
                  </div>
                )}
              </div>

              {/* 10. Soumissionnaire */}
              <div className="create-section">
                <div className="create-section-header">
                  <div className="create-section-num">10</div>
                  <div><h2 className="create-section-title">Soumissionnaire</h2></div>
                </div>
                <div className="create-grid">
                  <div className="create-field">
                    <label className="create-label">Nom</label>
                    <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input className="create-input" value={detailEditForm.soumissionnaire_nom} onChange={(e) => handleDetailEditChange('soumissionnaire_nom', e.target.value)} /></div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Email</label>
                    <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" className="create-input" value={detailEditForm.soumissionnaire_email} onChange={(e) => handleDetailEditChange('soumissionnaire_email', e.target.value)} /></div>
                  </div>
                  <div className="create-field">
                    <label className="create-label">Téléphone</label>
                    <div className="create-input-wrap"><svg className="create-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81"/></svg><input className="create-input" value={detailEditForm.soumissionnaire_telephone} onChange={(e) => handleDetailEditChange('soumissionnaire_telephone', e.target.value)} /></div>
                  </div>
                </div>
              </div>

              {/* Barre d'actions */}
              <div className="detail-edit-footer">
                <button type="button" className="create-btn-cancel" onClick={() => setDetailEditMode(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Annuler
                </button>
                <button type="button" className="create-btn-submit" onClick={handleDetailEditSave} disabled={savingDetail}>
                  {savingDetail
                    ? <><span className="spinner" />Enregistrement…</>
                    : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>Enregistrer les modifications</>
                  }
                </button>
              </div>
            </form>
          )}
          </div>{/* /detail-container */}
        </main>
      )}

      {/* ══════════════════════════════════════════════════
          VUE MISE À JOUR
      ══════════════════════════════════════════════════ */}
      {view === 'update' && (
        <main className="layout-grid">
          <section className="panel panel-wide">
            <h2 className="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Mettre à jour un établissement
            </h2>

            <div className="lookup-row">
              <label style={{flex:1}}>
                <span className="label-text">Code établissement</span>
                <input
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  placeholder="Ex : MINESURSI-ETAB002026"
                  onKeyDown={(e) => e.key === 'Enter' && loadForUpdateByCode()}
                />
              </label>
              <div style={{paddingTop:'1.5rem'}}>
                <button type="button" className="btn btn-soft" onClick={loadForUpdateByCode} disabled={loadingUpdate}>
                  {loadingUpdate ? <><span className="spinner" />Recherche…</> : 'Pré-remplir'}
                </button>
              </div>
            </div>

            {!updateForm && (
              <p className="hint-text">Saisissez un code établissement pour pré-remplir le formulaire de mise à jour.</p>
            )}

            {updateForm && (
              <form onSubmit={handlePatchUpdate} className="form-sections">
                <fieldset className="form-section">
                  <legend>Mise à jour partielle (PATCH)</legend>
                  <div className="section-grid">
                    <label>
                      <span className="label-text">Code établissement</span>
                      <input value={updateForm.code_etablissement} onChange={(e) => handleUpdateChange('code_etablissement', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Sigle</span>
                      <input value={updateForm.sigle} onChange={(e) => handleUpdateChange('sigle', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Nom</span>
                      <input value={updateForm.nom} onChange={(e) => handleUpdateChange('nom', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Province</span>
                      <input value={updateForm.province} onChange={(e) => handleUpdateChange('province', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Statut</span>
                      <select value={updateForm.statut} onChange={(e) => handleUpdateChange('statut', e.target.value)}>
                        <option value="public">Public</option>
                        <option value="prive">Privé</option>
                      </select>
                    </label>
                    <label>
                      <span className="label-text">Adresse</span>
                      <input value={updateForm.adresse} onChange={(e) => handleUpdateChange('adresse', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Email</span>
                      <input value={updateForm.email} onChange={(e) => handleUpdateChange('email', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Téléphone</span>
                      <input value={updateForm.telephone} onChange={(e) => handleUpdateChange('telephone', e.target.value)} />
                    </label>
                    <label>
                      <span className="label-text">Description</span>
                      <input value={updateForm.description} onChange={(e) => handleUpdateChange('description', e.target.value)} />
                    </label>
                  </div>
                </fieldset>

                <div style={{display:'flex', justifyContent:'flex-end', paddingTop:'0.25rem'}}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{minWidth:'180px'}}>
                    {saving ? <><span className="spinner" />Enregistrement…</> : 'Enregistrer (PATCH)'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      )}

    </div>
  );
}

export default App;
