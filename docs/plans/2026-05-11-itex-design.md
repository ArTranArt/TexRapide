# Document de Conception : TexRapide

**Projet :** TexRapide - Centre de Contrôle et Gestionnaire de Projets LaTeX
**Date :** 2026-05-11
**Statut :** Approuvé

## 1. Vision du Projet
TexRapide est une application desktop macOS (Tauri) conçue pour simplifier le workflow LaTeX. Elle agit comme un compagnon qui vérifie l'environnement, initialise les projets via des templates et automatise le cycle build/preview (Skim) via un mode "Watch" performant.

## 2. Architecture Technique
- **Framework :** Tauri (Rust + React)
- **Design System :** Glassmorphism (macOS Vibrancy, flou arrière-plan, minimalisme)
- **Backend (Rust) :**
    - `HealthManager` : Vérification des binaires (`pdflatex`, `latexmk`).
    - `ProjectManager` : Création de projets, gestion des templates.
    - `WatchService` : Surveillance FS (`notify`) et orchestration du build.
- **Frontend (Web) :**
    - React avec CSS Vanille moderne.
    - Dashboard d'état et configurateur de projet.

## 3. Fonctionnalités Clés
- **System Checkup :** Diagnostic instantané de l'installation LaTeX.
- **Quick Project Creation :** Sélection de template, personnalisation du chemin, chemins par défaut éditables.
- **Smart Watch Mode :** Compilation automatique et rafraîchissement de Skim lors de la sauvegarde dans l'éditeur (Neovim/VSCode).
- **Settings Center :** Gestion des dossiers par défaut pour les projets et les templates.

## 4. Design Aesthetics
- Effet de verre (Glassmorphism).
- Couleurs harmonieuses (Dark mode par défaut, accents vibrants).
- Animations fluides pour les changements d'état (build en cours, succès, erreur).

## 5. Gestion des Erreurs
- Notification claire en cas d'échec de compilation.
- Console de logs intégrée pour le débogage rapide des erreurs LaTeX.

## 6. Prochaines Étapes
1. Initialisation du projet Tauri.
2. Développement du module de Checkup.
3. Implémentation de l'UI Glassmorphism.
4. Mise en place du mode Watch.
