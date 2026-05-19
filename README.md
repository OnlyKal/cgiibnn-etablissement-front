# Application de gestion des etablissements

Application web React connectee a des API backend existantes pour gerer les etablissements.

Base URL par defaut:

- `http://127.0.0.1:8000/`

## Fonctionnalites

- Creation d un etablissement
- Mise a jour d un etablissement via ID ou code_etablissement
- Consultation de la liste des etablissements avec filtres et pagination
- Consultation des details complets d un etablissement
- Affichage et gestion des fichiers associes (documents administratifs)

## Contraintes techniques prises en charge

- Aucun backend n est recree: le frontend consomme vos endpoints existants.
- Endpoint de creation appele sans auth cote frontend (cas public `AllowAny`).
- Types de requetes supportes:
- `application/json` quand aucun fichier n est present
- `multipart/form-data` quand au moins un document contient un fichier

## Lancer le projet

```bash
npm install
npm start
```

Ouvrir ensuite http://localhost:3000.

## Scripts utiles

- `npm start`: lance l application en mode developpement
- `npm run dev`: alias de `npm start`
- `npm test`: execute les tests
- `npm run build`: genere une version de production

## Configuration des routes API (optionnel)

Vous pouvez surcharger les chemins des endpoints avec des variables d environnement CRA:

- `REACT_APP_API_BASE_URL` (defaut: `http://127.0.0.1:8000/`)
- `REACT_APP_API_CREATE_PATH` (defaut: `etablissements/`)
- `REACT_APP_API_LIST_PATH` (defaut: `etablissements/`)
- `REACT_APP_API_DETAIL_PATH` (defaut: `etablissements/{id}/`)
- `REACT_APP_API_UPDATE_PATH` (defaut: `etablissements/{id}/`)
- `REACT_APP_API_BY_CODE_PATH` (defaut: `etablissements/by-code/{code}/`)

Exemple dans `.env`:

```bash
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/
REACT_APP_API_CREATE_PATH=api/etablissements/create/
REACT_APP_API_LIST_PATH=api/etablissements/
REACT_APP_API_DETAIL_PATH=api/etablissements/{id}/
REACT_APP_API_UPDATE_PATH=api/etablissements/{id}/
REACT_APP_API_BY_CODE_PATH=api/etablissements/code/{code}/
```
