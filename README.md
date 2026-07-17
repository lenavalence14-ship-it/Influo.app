# Influo — PWA

Plateforme mettant en relation influenceurs et entreprises. React + Vite + Supabase + PWA.

## Démarrage

```bash
npm install
npm run dev
```

Le fichier `.env` contient déjà les clés de connexion au projet Supabase `influo-app`
(URL + clé publique anon — sûres à exposer côté client). Rien à configurer pour démarrer.

## Build de production

```bash
npm run build
npm run preview
```

## État du projet (important à lire)

**Paiement mocké** : le flux de paiement (demande → bouton payer → crédit du wallet)
est entièrement fonctionnel côté logique métier (commission 10%, statuts de commande,
wallet verrouillé/disponible), mais **aucune vraie API de paiement locale (MTN Mobile
Money, Moov Money) n'est connectée**. Le paiement est simulé (`provider_simule: 'mock'`
dans la table `paiements`). Pour brancher un vrai rail de paiement, il faut :
1. Créer un compte marchand chez un agrégateur (ex : CinetPay, PawaPay, Fedapay) ou
   directement les API MTN MoMo / Moov Money
2. Remplacer la fonction `payer()` dans `src/pages/Conversation.jsx` par un vrai appel API
3. Gérer les webhooks de confirmation de paiement côté serveur (nécessite une Edge Function
   Supabase, pas seulement du code client)

**Compte admin** : un compte admin existe déjà dans Supabase Auth
(`ceo@influo.app`). Il n'y a pas d'interface de création d'admin dans l'app — c'est
volontaire, un rôle admin ne doit jamais être auto-inscriptible. Pour créer un autre
admin, il faut le faire manuellement dans la base (table `users`, colonne `role`).

**Retraits Mobile Money** : le flux de demande de retrait est fonctionnel (déduction
du solde disponible, historique), mais le virement réel vers MTN/Moov n'est pas
automatisé — un admin doit traiter manuellement les retraits `en_attente` pour l'instant
(pas encore d'interface admin dédiée à ça, à ajouter en V1.1).

## Structure

- `src/pages/` — chaque écran de l'app
- `src/components/` — composants réutilisables (boutons, cards, nav...)
- `src/context/` — état global (auth, thème dark/light)
- `src/hooks/` — logique de récupération de données Supabase
- `src/lib/supabase.js` — client Supabase

## Design

Noir/blanc strict (pas de couleur d'accent), bascule dark/light, glassmorphism
assumé sur nav/headers/cards/modals. Polices : Space Grotesk (titres), Inter (texte),
JetBrains Mono (montants/chiffres). Le motif en barres d'onde du logo est repris comme
signature visuelle (loaders, éléments de marque).

## Base de données

17 tables sur Supabase (projet `influo-app`), RLS activé sur toutes, 4 buckets de
stockage (avatars, posts, offres, messagerie). Le schéma complet est appliqué —
pour le reproduire ailleurs, exporter les migrations depuis le dashboard Supabase.
