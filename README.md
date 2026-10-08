<div align="center">

# ⚡️ TexRapide

**Un centre de contrôle desktop moderne et ultra-rapide pour vos projets LaTeX.**

[![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)]()
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)]()
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)]()
[![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()

*Développez, compilez et visualisez vos documents LaTeX en temps réel, sans aucune installation complexe.*

</div>

---

## 📖 Table des matières
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Pourquoi TexRapide ?](#-pourquoi-texrapide-)
- [Démarrage Rapide (Utilisateurs)](#-démarrage-rapide-utilisateurs)
- [Démarrage Rapide (Développeurs)](#-démarrage-rapide-développeurs)
- [Architecture Technique](#-architecture-technique)
- [Contribuer](#-contribuer)

---

## ✨ Fonctionnalités Principales

*   🚀 **Zéro Installation ("Clé en main")** : TexRapide installe automatiquement le moteur léger **Tectonic** en arrière-plan. Vous n'avez pas besoin d'installer l'énorme MacTeX ou MiKTeX. Vous téléchargez l'app, et ça marche directement.
*   📖 **Lecteur PDF Natif Intégré** : L'application embarque un lecteur PDF ultra-rapide qui se met à jour en temps réel à chaque sauvegarde, sans clignotement.
*   🔗 **SyncTeX Bidirectionnel** : Double-cliquez sur le PDF pour sauter directement à la ligne de code correspondante, et vice versa.
*   🔄 **Compilation "Watch" automatique** : Sauvegardez votre fichier `.tex`, le PDF se recompile tout seul en une fraction de seconde grâce à une gestion fine de l'état.
*   💻 **Multiplateforme natif** : Poids plume et performances maximales grâce à Tauri v2 (Mac, Windows, Linux).

---

## 🤔 Pourquoi TexRapide ?

L'écosystème LaTeX est historiquement lourd : il nécessite de télécharger des gigaoctets de paquets, de configurer des scripts obscurs (`latexmk`), et de synchroniser des éditeurs tiers avec des lecteurs PDF externes (comme Skim ou SumatraPDF).

**TexRapide casse ce modèle.** 
Grâce à **Tectonic**, le moteur télécharge les paquets nécessaires "à la volée" depuis le cloud. Et grâce au **lecteur PDF natif**, vous n'avez plus besoin d'aucun outil externe. Tout est géré dans une seule interface moderne, rapide, et esthétique.

---

## 🚀 Démarrage Rapide (Utilisateurs)

1. Allez dans l'onglet **Releases** de ce dépôt GitHub.
2. Téléchargez la version correspondante à votre système (`.dmg` pour Mac, `.exe` pour Windows, ou `.AppImage` pour Linux).
3. Ouvrez TexRapide. C'est prêt !

*(À la première ouverture, TexRapide téléchargera discrètement le moteur Tectonic en tâche de fond. Cela peut prendre quelques secondes).*

---

## 🛠️ Démarrage Rapide (Développeurs)

Si vous souhaitez modifier le code ou lancer l'application en mode développement local :

### Outils de développement requis
*   **Node.js** (LTS >= 18 ou 20 recommandé) & **pnpm**
*   **Rust** (via `rustup`)
*   *macOS* : Xcode Command Line Tools (`xcode-select --install`)
*   *Windows* : Visual Studio Build Tools (avec charge de travail C++)

### Installation & Lancement
```bash
# 1. Cloner le dépôt et installer les dépendances frontend
pnpm install

# 2. Lancer l'application en mode développement (avec Hot-Reload)
pnpm run tauri dev

# 3. Compiler un exécutable de production (.app ou .exe)
pnpm run tauri build
```

---

## 🧠 Architecture Technique

TexRapide est construit avec une architecture moderne séparant le frontend du système :
*   **Frontend** : React, TailwindCSS, TypeScript (Géré via Vite). Le "God Hook" React a été découpé, et Zustand est utilisé pour une gestion d'état ultra-performante sans re-rendus inutiles.
*   **Backend / Core** : Rust (Tauri v2). Rust gère le Watcher système (pour surveiller les fichiers) et l'installation/exécution asynchrone des moteurs LaTeX.
*   **Communication** : Tauri IPC (Inter-Process Communication).

Nous recommandons d'utiliser **VS Code** avec les extensions :
- `Tauri` (pour les outils intégrés)
- `rust-analyzer` (pour l'autocomplétion Rust)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! 
1. Forkez le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/IncroyableFonctionnalite`)
3. Commitez vos changements (`git commit -m 'feat: ajout de la fonctionnalité'`)
4. Pushez vers la branche (`git push origin feature/IncroyableFonctionnalite`)
5. Ouvrez une Pull Request
