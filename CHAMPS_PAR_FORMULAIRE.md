# Inventaire des champs par formulaire

Source analysée : formulaire de création défini dans `src/App.js`.

- **Tous les établissements** : champ commun aux établissements publics et privés.
- **Public uniquement** : champ réservé aux établissements publics.
- **Privé uniquement** : champ réservé aux établissements privés.

### FORMULAIRE 1 : Identification de l'Établissement

| Champ | Type | Condition |
|---|---|---|
| Nom de l'établissement | TEXT | Tous les établissements |
| Sigle de l'établissement | TEXT | Tous les établissements |
| Statut | LISTE : Public / Privé | Tous les établissements |
| Logo | IMAGE | Tous les établissements |
| Nom du promoteur | TEXT | Privé uniquement |
| Téléphone du promoteur | TÉLÉPHONE | Privé uniquement |
| Email du promoteur | EMAIL | Privé uniquement |
| Prise en charge par l'État ? | BOOLÉEN : Oui / Non | Privé uniquement |
| Acte de prise en charge | FICHIER | Privé uniquement |
| Convention de l'État | FICHIER | Privé uniquement, si prise en charge par l'État = Oui |

### FORMULAIRE 2 : Localisation et contact de l'Établissement

| Champ | Type | Condition |
|---|---|---|
| Adresse | TEXT | Tous les établissements |
| Rue / Avenue | TEXT | Tous les établissements |
| Commune | TEXT | Tous les établissements |
| Ville / Localité | TEXT | Tous les établissements |
| Province | LISTE | Tous les établissements |
| Téléphone | TÉLÉPHONE | Tous les établissements |
| Email | EMAIL | Tous les établissements |
| Latitude | DÉCIMAL | Tous les établissements |
| Longitude | DÉCIMAL | Tous les établissements |
| Description | TEXT LONG | Tous les établissements |

### FORMULAIRE 3 : Création et autorisation

| Champ | Type | Condition |
|---|---|---|
| Date de création | DATE | Tous les établissements |
| Acte juridique de création | FICHIER | Tous les établissements |
| Acte juridique d'autorisation de fonctionnement | FICHIER | Privé uniquement |
| Acte juridique d'agrément | FICHIER | Privé uniquement |

### FORMULAIRE 4 : Comité de gestion

#### Recteur / Directeur Général

| Champ | Type | Condition |
|---|---|---|
| Nom complet du Recteur / Directeur Général | TEXT | Tous les établissements |
| Sexe du Recteur / Directeur Général | LISTE : Masculin / Féminin | Tous les établissements |
| Grade du Recteur / Directeur Général | TEXT | Tous les établissements |
| Téléphone du Recteur / Directeur Général | TÉLÉPHONE | Tous les établissements |
| Email du Recteur / Directeur Général | EMAIL | Tous les établissements |
| Arrêté de nomination du Recteur / Directeur Général | FICHIER | Tous les établissements |
| Recteur / Directeur Général en fonction ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Hors fonction depuis | DATE | Tous les établissements, si en fonction = Non |
| Motif de fin de fonction | TEXT | Tous les établissements, si en fonction = Non |

#### Secrétaire Général Académique

| Champ | Type | Condition |
|---|---|---|
| Nom complet du Secrétaire Général Académique | TEXT | Tous les établissements |
| Sexe du Secrétaire Général Académique | LISTE : Masculin / Féminin | Tous les établissements |
| Grade du Secrétaire Général Académique | TEXT | Tous les établissements |
| Téléphone du Secrétaire Général Académique | TÉLÉPHONE | Tous les établissements |
| Email du Secrétaire Général Académique | EMAIL | Tous les établissements |
| Arrêté de nomination du Secrétaire Général Académique | FICHIER | Tous les établissements |
| Secrétaire Général Académique en fonction ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Hors fonction depuis | DATE | Tous les établissements, si en fonction = Non |
| Motif de fin de fonction | TEXT | Tous les établissements, si en fonction = Non |

#### Administrateur du Budget

| Champ | Type | Condition |
|---|---|---|
| Nom complet de l'Administrateur du Budget | TEXT | Tous les établissements |
| Sexe de l'Administrateur du Budget | LISTE : Masculin / Féminin | Tous les établissements |
| Grade de l'Administrateur du Budget | TEXT | Tous les établissements |
| Téléphone de l'Administrateur du Budget | TÉLÉPHONE | Tous les établissements |
| Email de l'Administrateur du Budget | EMAIL | Tous les établissements |
| Arrêté de nomination de l'Administrateur du Budget | FICHIER | Tous les établissements |
| Administrateur du Budget en fonction ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Hors fonction depuis | DATE | Tous les établissements, si en fonction = Non |
| Motif de fin de fonction | TEXT | Tous les établissements, si en fonction = Non |

#### Secrétaire Général à la Recherche

| Champ | Type | Condition |
|---|---|---|
| Nom complet du Secrétaire Général à la Recherche | TEXT | Tous les établissements |
| Sexe du Secrétaire Général à la Recherche | LISTE : Masculin / Féminin | Tous les établissements |
| Grade du Secrétaire Général à la Recherche | TEXT | Tous les établissements |
| Téléphone du Secrétaire Général à la Recherche | TÉLÉPHONE | Tous les établissements |
| Email du Secrétaire Général à la Recherche | EMAIL | Tous les établissements |
| Arrêté de nomination du Secrétaire Général à la Recherche | FICHIER | Tous les établissements |
| Secrétaire Général à la Recherche en fonction ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Hors fonction depuis | DATE | Tous les établissements, si en fonction = Non |
| Motif de fin de fonction | TEXT | Tous les établissements, si en fonction = Non |

### FORMULAIRE 5 : Ressources humaines

| Champ | Type | Condition |
|---|---|---|
| Nombre total d'enseignants | ENTIER | Tous les établissements |
| Professeurs Ordinaires (PO) | ENTIER | Tous les établissements |
| Professeurs (P) | ENTIER | Tous les établissements |
| Professeurs Associés (PA) | ENTIER | Tous les établissements |
| Effectif d'enseignants de sexe féminin | ENTIER | Tous les établissements |
| Chefs des travaux | ENTIER | Tous les établissements |
| Assistants | ENTIER | Tous les établissements |
| Chargés de pratiques professionnelles | ENTIER | Tous les établissements |
| Effectif du personnel scientifique de sexe féminin | ENTIER | Tous les établissements |
| Cadres de commandement | ENTIER | Tous les établissements |
| Cadres de collaboration | ENTIER | Tous les établissements |
| Agents d'exécution | ENTIER | Tous les établissements |

### FORMULAIRE 6 : Organisation académique

| Champ | Type | Condition |
|---|---|---|
| Filières organisées | LISTE | Tous les établissements |
| Nom de la filière | TEXT | Tous les établissements, pour chaque filière ajoutée |
| Effectifs annuels de la filière | LISTE | Tous les établissements, pour chaque filière ajoutée |
| Année de l'effectif | ENTIER | Tous les établissements, pour chaque effectif annuel ajouté |
| Effectif total annuel | ENTIER | Tous les établissements, pour chaque effectif annuel ajouté |
| Effectif masculin annuel | ENTIER | Tous les établissements, pour chaque effectif annuel ajouté |
| Effectif féminin annuel | ENTIER | Tous les établissements, pour chaque effectif annuel ajouté |
| Accords de mobilité internationale des étudiants | LISTE | Tous les établissements |
| Accord de mobilité | TEXT | Tous les établissements, pour chaque accord ajouté |
| Licence | BOOLÉEN | Tous les établissements |
| Master | BOOLÉEN | Tous les établissements |
| Doctorat | BOOLÉEN | Tous les établissements |
| Effectif Licence total | ENTIER | Tous les établissements |
| Effectif Master total | ENTIER | Tous les établissements |
| Effectif Doctorat total | ENTIER | Tous les établissements |
| Effectif d'étudiants vivant avec un handicap | ENTIER | Tous les établissements |
| Étudiants LMD total | ENTIER | Tous les établissements |
| Autres niveaux | TEXT | Tous les établissements |
| Effectif des autres niveaux | ENTIER | Tous les établissements |

### FORMULAIRE 7 : Patrimoine immobilier

Ce formulaire ne s'affiche pas pour les établissements privés.

| Champ | Type | Condition |
|---|---|---|
| Titre de propriété immobilière | FICHIER | Public uniquement |
| Nombre des résidences pour le personnel | ENTIER | Public uniquement |
| Nombre des résidences estudiantines | ENTIER | Public uniquement |
| L'établissement est locataire ? | BOOLÉEN : Oui / Non | Public uniquement |
| Propriétés sans titre foncier | TEXT LONG | Public uniquement |
| Nom du responsable patrimoine | TEXT | Public uniquement |
| Téléphone du responsable patrimoine | TÉLÉPHONE | Public uniquement |
| Email du responsable patrimoine | EMAIL | Public uniquement |

### FORMULAIRE 8 : Organisation et gestion

| Champ | Type | Condition |
|---|---|---|
| Existence d'un cadre organique / organigramme approuvé | BOOLÉEN : Oui / Non | Tous les établissements |
| Fichier organigramme | FICHIER | Tous les établissements, si existence d'un organigramme = Oui |
| Existence d'un mécanisme d'audit interne | BOOLÉEN : Oui / Non | Tous les établissements |

### FORMULAIRE 9 : Contrôles et suivi

| Champ | Type | Condition |
|---|---|---|
| Date du dernier contrôle viabilité | DATE | Tous les établissements |
| Date du dernier contrôle gestion | DATE | Tous les établissements |
| Date du dernier contrôle scolarité | DATE | Tous les établissements |
| Nombre de dossiers finalistes contrôlés | ENTIER | Tous les établissements |

### FORMULAIRE 10 : École doctorale

| Champ | Type | Condition |
|---|---|---|
| Organise une école doctorale ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Textes juridiques de création / autorisation de l'école | FICHIER PDF | Tous les établissements, si école doctorale = Oui |
| Filières organisées doctorales | LISTE | Tous les établissements, si école doctorale = Oui |
| Nom de la filière doctorale | TEXT | Tous les établissements, pour chaque filière doctorale ajoutée |

### FORMULAIRE 11 : Marchés publics

| Champ | Type | Condition |
|---|---|---|
| Cellule marchés publics en place ? | BOOLÉEN : Oui / Non | Tous les établissements |
| Membres de la cellule marchés publics | LISTE | Tous les établissements, si cellule marchés publics = Oui |
| Nom du membre | TEXT | Tous les établissements, pour chaque membre ajouté |
| Téléphone du membre | TÉLÉPHONE | Tous les établissements, pour chaque membre ajouté |
| Email du membre | EMAIL | Tous les établissements, pour chaque membre ajouté |

### FORMULAIRE 12 : Soumissionnaire

| Champ | Type | Condition |
|---|---|---|
| Nom complet | TEXT | Tous les établissements |
| Adresse e-mail | EMAIL | Tous les établissements |
| Téléphone | TÉLÉPHONE | Tous les établissements |
| Qualité du soumissionnaire | TEXT | Tous les établissements |

### FORMULAIRE 13 : Récapitulatif

Le récapitulatif affiche les données renseignées dans les formulaires précédents. Il ne contient aucun nouveau champ de saisie.

## Résumé des champs spécifiques

### Privé uniquement

| Champ | Type | Condition |
|---|---|---|
| Nom du promoteur | TEXT | Privé uniquement |
| Téléphone du promoteur | TÉLÉPHONE | Privé uniquement |
| Email du promoteur | EMAIL | Privé uniquement |
| Prise en charge par l'État ? | BOOLÉEN : Oui / Non | Privé uniquement |
| Acte de prise en charge | FICHIER | Privé uniquement |
| Convention de l'État | FICHIER | Privé uniquement, si prise en charge par l'État = Oui |
| Acte juridique d'autorisation de fonctionnement | FICHIER | Privé uniquement |
| Acte juridique d'agrément | FICHIER | Privé uniquement |

### Public uniquement

| Champ | Type | Condition |
|---|---|---|
| Titre de propriété immobilière | FICHIER | Public uniquement |
| Nombre des résidences pour le personnel | ENTIER | Public uniquement |
| Nombre des résidences estudiantines | ENTIER | Public uniquement |
| L'établissement est locataire ? | BOOLÉEN : Oui / Non | Public uniquement |
| Propriétés sans titre foncier | TEXT LONG | Public uniquement |
| Nom du responsable patrimoine | TEXT | Public uniquement |
| Téléphone du responsable patrimoine | TÉLÉPHONE | Public uniquement |
| Email du responsable patrimoine | EMAIL | Public uniquement |

Tous les autres champs concernent les établissements publics et privés.
