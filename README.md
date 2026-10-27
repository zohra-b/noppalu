# Casa Noppalu

Site web de **Casa Noppalu**, maison d'hôtes de trois studios indépendants à Saly (Niakhnakhal), au Sénégal.

Le site présente les studios, affiche leurs disponibilités, reçoit des **demandes de réservation** et dispose d'un **espace d'administration** (`/admin`) pour traiter les demandes, gérer le calendrier et modifier le contenu. Il n'y a pas de paiement en ligne : le client paie manuellement (Wave, virement, PayPal) après acceptation de sa demande.

## Fonctionnalités

**Partie publique**

- Accueil, présentation des studios et page détaillée de chaque studio (photos, équipements, tarifs, services, conditions).
- Calendrier de disponibilités en lecture seule, par studio ou pour tous les studios.
- Page de demande de réservation : choix des dates, des studios libres, coordonnées, estimation du prix.
- Formulaire de contact (validation, anti-spam, lien WhatsApp en cas d'échec).
- Trois langues : français (par défaut), anglais, espagnol.

**Administration (`/admin`)**

- Connexion sécurisée (identifiant et mot de passe, limitation des tentatives).
- Réservations : liste filtrable, fiche détaillée, acceptation, refus, paiement reçu, annulation, modification des dates, création d'une réservation (directe, Booking.com, Airbnb).
- Calendrier : vue des nuits occupées, blocage de dates (séjour personnel, travaux).
- Réglages : studios, tarifs, annonce au-dessus des tarifs, services, conditions.
- Tableau de bord avec les arrivées des 48 prochaines heures et un e-mail de rappel chaque matin.

Un mode d'emploi détaillé de l'administration existe séparément (document « Mode d'emploi de l'administration »).

## Stack technique

- [Next.js](https://nextjs.org/) 16 (App Router, Turbopack), React, TypeScript
- Tailwind CSS
- [next-intl](https://next-intl.dev/) pour le multilingue
- [Supabase](https://supabase.com/) : PostgreSQL, authentification, règles d'accès (RLS)
- [Resend](https://resend.com/) pour l'envoi des e-mails
- lucide-react pour les icônes
- Hébergement : [Vercel](https://vercel.com/) (déploiement à chaque push sur `main`, tâche planifiée)

## Démarrer en local

Prérequis : Node.js récent (20.9 ou plus, à vérifier selon la version de Next.js installée).

```bash
npm install
npm run dev
```

Le site est alors sur [http://localhost:3000](http://localhost:3000), qui redirige vers une langue (`/fr`, `/en` ou `/es`).

### Commandes utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Lance le build de production |
| `npm run lint` | Analyse du code |
| `npx tsc --noEmit` | Vérification des types TypeScript |
| `node scripts/verifier-messages.mjs` | Compare `en.json` et `es.json` avec `fr.json` (clés manquantes, variables) |

## Variables d'environnement

En local, dans `.env.local` (jamais dans Git). En ligne, dans Vercel (Settings, Environment Variables).

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (lecture soumise aux règles d'accès) |
| `SUPABASE_SECRET_KEY` | Clé secrète : accès complet, **serveur uniquement**, jamais de préfixe `NEXT_PUBLIC_` |
| `ADMIN_EMAIL` | Adresse du compte administrateur (l'identifiant affiché est `admin`) |
| `RESEND_API_KEY` | Clé d'API Resend |
| `CONTACT_FROM_EMAIL` | Adresse d'expédition (domaine vérifié chez Resend) |
| `CONTACT_TO_EMAIL` | Adresse qui reçoit les messages et les demandes |
| `CRON_SECRET` | Clé de la tâche planifiée des rappels (Production) |
| `REMINDER_TO_EMAIL` | Facultative : autre destinataire pour les rappels du matin |

### Deux environnements

| Où | Base Supabase lue |
| --- | --- |
| Ordinateur (`npm run dev`) | Projet **dev** |
| Vercel, déploiements Preview | Projet **dev** |
| Vercel, Production | Projet **production** |

Les **données ne passent jamais** d'un environnement à l'autre : les vraies demandes et les vraies dates ne vivent qu'en production. 

## Base de données

Tables principales :

| Table | Contenu |
| --- | --- |
| `bungalows` | Les studios : nom, publication, capacité, lit, équipements, résumé et description (JSON par langue) |
| `site_settings` | Une seule ligne : prix des saisons, affichage des prix, conditions et annonce (JSON par langue) |
| `site_services` | Services annexes (transfert, petit-déjeuner…), prix facultatif |
| `availability_blocks` | Nuits occupées (la source de vérité des disponibilités) |
| `booking_requests` | Demandes et réservations, avec statut, origine et suivi du paiement |
| `payment_details` | Coordonnées de paiement (privées) |
| `admin_login_attempts` | Tentatives de connexion à l'administration (limitation) |
| vue `availability_public` | Dates occupées des studios publiés, sans aucune donnée privée |

Conventions et règles :

- Les dates sont des **nuits avec date de fin exclusive** : l'arrivée est la première nuit, le départ est le jour où le studio est libéré. Un départ et une arrivée le même jour sont compatibles.
- Une contrainte de la base interdit deux blocages qui se chevauchent pour un même studio.
- Les opérations qui touchent deux tables passent par des fonctions SQL (`accepter_demande`, `annuler_demande`, `creer_reservation`, `modifier_dates_reservation`) : tout réussit ou rien ne change.
- Statuts d'une demande : `nouvelle`, `acceptee`, `payee`, `refusee`, `expiree` (annulée). Origines : `site`, `direct`, `booking`, `airbnb`.

**Sécurité**

- La RLS est activée sur toutes les tables. Le public peut lire les studios, les réglages, les services actifs et la vue `availability_public`. Il n'a **aucun accès** à `availability_blocks`, `booking_requests`, `payment_details` ni `admin_login_attempts`.
- Toute page et toute action de l'administration commence par `requireAdmin()`.
- La clé secrète n'est utilisée que dans du code serveur (`server-only`).

**Modifier la structure de la base** : écrire le SQL dans un fichier (dossier `database/`), l'exécuter d'abord sur le projet de dev, puis sur celui de production **avant** de pousser le code qui en dépend.

## Structure du projet

```
src/
├── app/
│   ├── [locale]/              Pages publiques (préfixe de langue : /fr/...)
│   │   ├── layout.tsx         Layout racine (<html lang>, traductions, Header, Footer)
│   │   ├── page.tsx           Accueil
│   │   ├── bungalows/         Présentation + page détaillée [slug]
│   │   ├── reservation/       Demande de réservation
│   │   ├── contact/           Formulaire de contact
│   │   └── [...rest]/         Capte les URL inconnues (404 localisée)
│   ├── admin/                 Administration (hors des langues, en français)
│   │   ├── reservations/      Liste, calendrier, création
│   │   ├── demandes/[id]/     Fiche d'une demande ou réservation
│   │   ├── calendrier/        Composants du calendrier (page = redirection)
│   │   └── reglages/          Studios, tarifs, services, conditions
│   ├── api/
│   │   ├── contact/           Envoi du formulaire de contact
│   │   ├── reservation/       Réception d'une demande de réservation
│   │   └── cron/rappels/      Rappel quotidien des arrivées (tâche Vercel)
│   ├── global-error.tsx       Erreur fatale (volontairement en français)
│   └── sitemap.ts
├── components/                Header, Footer, Gallery, Button, BungalowInfos, Calendrier, ReservationForm
├── i18n/                      Configuration next-intl (routing, request, navigation)
├── lib/                       Logique métier et accès aux données
│   ├── supabase/              Clients : public, session administrateur, clé secrète
│   ├── saisons.ts             Dates des saisons et calcul des prix
│   ├── sejour.ts              Règles d'un séjour (durée, délais, dates)
│   ├── photos.ts              Photos de chaque studio
│   ├── messages-demande.ts    Messages préparés pour les clients
│   └── ...
├── messages/                  fr.json, en.json, es.json : textes de l'interface
└── proxy.ts                   Langue des pages publiques + session de l'administration
public/images/                 Photos et logo
scripts/                       Outils (vérification des traductions)
database/                      Scripts SQL (structure et migrations)
vercel.json                    Tâche planifiée
```

## Langues

Les URL sont préfixées par la langue : `/fr/bungalows`, `/en/bungalows`, `/es/bungalows`. Les langues actives sont déclarées dans `src/i18n/routing.ts`. Le sélecteur de langue du Header apparaît dès qu'il y en a plusieurs.

Il y a deux sortes de textes :

- **Textes de l'interface** : `src/messages/<langue>.json`. Aucun texte n'est écrit en dur dans les pages publiques.
- **Contenu modifiable** (résumés et descriptions des studios, conditions, noms des services, annonce) : en base, un champ par langue, modifiable dans l'administration. Quand une langue manque, le site affiche le français.

### Ajouter ou modifier une langue

1. Créer ou modifier `src/messages/<langue>.json` en gardant **les mêmes clés** que `fr.json` et les mêmes variables (`{nom}`, `{n}`…). Vérifier avec `node scripts/verifier-messages.mjs`.
2. Déclarer la langue dans `src/i18n/routing.ts` (`locales`).
3. Renseigner le contenu en base depuis l'administration (Réglages) : résumés, descriptions, conditions, services, annonce.
4. Ajouter les textes d'e-mail de la langue : `TEXTES_CONFIRMATION` dans `src/app/api/reservation/route.ts` et `GENERATEURS` dans `src/lib/messages-demande.ts`. **Tant que ce n'est pas fait, les e-mails destinés aux clients partent en français.**

Règles à connaître :

- Dans les composants, importer `Link`, `useRouter`, `usePathname` et `redirect` depuis `@/i18n/navigation`, pas depuis `next/link` ni `next/navigation` (seul `notFound` reste dans `next/navigation`).
- Composant serveur (`async`) : `getTranslations`. Composant client (`"use client"`) : `useTranslations`.
- Une virgule en trop dans un fichier JSON casse tout le site. Éviter une apostrophe juste avant une accolade (`d'{prix}`), qui est lue comme un échappement.

## Prix et saisons

- Trois tarifs par nuit, modifiables dans l'administration : basse saison (juin à octobre), haute saison (novembre à mai), fêtes de fin d'année (15 décembre au 14 janvier, prioritaires).
- **Les dates des saisons sont dans le code** (`PERIODES`, `src/lib/saisons.ts`). Le prix d'un séjour est la somme du prix de chaque nuit (`prixDuSejour`).
- Une case de l'administration permet de masquer les tarifs sur le site (« Nous consulter ») ; ils servent alors uniquement aux estimations.
- Les montants sont aussi présentés en euros dans l'administration, à la parité fixe du franc CFA (1 € = 655,957 FCFA).

## Réservations

1. Le visiteur envoie une demande depuis `/reservation` : studio libre, dates (de 2 à 14 nuits), coordonnées. Les règles sont vérifiées côté serveur (`src/lib/sejour.ts`).
2. L'administrateur reçoit un e-mail, le visiteur un accusé de réception. La demande est enregistrée avec une estimation du prix.
3. L'administrateur **accepte** la demande : les dates sont bloquées immédiatement et le délai de paiement de 72 h démarre.
4. Il envoie au client le message d'acceptation préparé (montant, moyens de paiement, annulation).
5. À réception du paiement, **Paiement reçu** : confirmation envoyée automatiquement au client (demandes du site et réservations directes avec adresse e-mail).
6. Un refus ou une annulation prépare un message, jamais envoyé automatiquement.

Les réservations reçues sur Booking.com, Airbnb ou par téléphone s'ajoutent à la main (**Nouvelle réservation**). Tant que la synchronisation iCal n'existe pas, les calendriers des plateformes et celui du site doivent être tenus à jour à la main des deux côtés.

## E-mails

- `src/app/api/contact` et `src/app/api/reservation` : messages du site, via Resend.
- `src/lib/messages-demande.ts` : textes des messages préparés dans l'administration et de la confirmation de paiement.
- `src/lib/emails-rappel.ts` : rappel quotidien des arrivées.
- La **politique d'annulation** est écrite dans les conditions du site (en base) et dans les textes des e-mails (dans le code) : la modifier aux deux endroits.

## Tâche planifiée

`vercel.json` déclare un appel quotidien à `/api/cron/rappels` à 07:00 UTC (7 h au Sénégal, qui est à l'heure UTC toute l'année). Sur l'offre gratuite de Vercel, la tâche part à une minute quelconque de l'heure prévue. L'appel est protégé par `CRON_SECRET`. Aucun e-mail n'est envoyé les jours sans arrivée dans les 48 prochaines heures.

## Déploiement

- Branches : développement sur `dev`, puis fusion dans `main`.
- Un push sur `main` déclenche le déploiement en production sur Vercel.
- Avant de pousser un changement qui dépend de la base : exécuter le SQL sur le projet de production.
- Ajouter dans Vercel toute nouvelle variable d'environnement (Production, et Preview si utile), puis redéployer : les variables `NEXT_PUBLIC_` sont intégrées au code au moment du build.

## Dépannage

- **Erreurs TypeScript dans `.next/.../validator.ts`** : supprimer le dossier `.next` (`Remove-Item -Recurse -Force .next` sous PowerShell), puis `npx next typegen` ou `npm run dev`.
- **Impossible de déplacer un dossier sous Windows** : arrêter d'abord le serveur de développement.
- **Le site casse après une modification d'un fichier JSON de messages** : chercher une virgule en trop ou manquante.
- **`npm audit`** : ne jamais lancer `npm audit fix --force`, qui peut rétrograder Next.js.
- **Champ de date sous Chrome** : le navigateur envoie la date à chaque chiffre tapé (année `0002`, `0020`…). Les fonctions de `src/lib/sejour.ts` en tiennent compte (`etatDate`, `dateValide`).

## Feuille de route

Fait :

- [x] Structure multilingue (français, anglais, espagnol)
- [x] Pages publiques, calendrier, demande de réservation, contact
- [x] Base Supabase de développement et de production
- [x] Administration : réservations, calendrier, réglages, rappels

À faire :

- [ ] Textes d'e-mail en anglais et en espagnol, déplacés dans des fichiers par langue
- [ ] Synchronisation iCal avec Airbnb et Booking.com
- [ ] Mentions légales et page de confidentialité
- [ ] Sauvegardes régulières de la base de production
- [ ] Dates des saisons modifiables depuis l'administration
- [ ] Promotions et tarifs exceptionnels (`price_overrides`)
- [ ] Paiement en ligne (Stripe ou Wave), seulement si le besoin apparaît