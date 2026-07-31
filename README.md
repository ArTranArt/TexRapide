<div align="center">

# ⚡️ TexRapide

**Un centre de contrôle desktop moderne et ultra-rapide pour vos projets LaTeX.**

[![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)]()
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)]()
[![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()

*Développez, compilez et visualisez vos documents LaTeX en temps réel, sans prise de tête.*

</div>

---

## 📖 Table des matières
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Prérequis (Important)](#-prérequis-système)
  - [macOS](#-sur-macos)
  - [Windows](#-sur-windows)
- [Démarrage Rapide (Développeurs)](#-démarrage-rapide)
- [Architecture Technique](#-architecture-technique)
- [Contribuer](#-contribuer)

---

## ✨ Fonctionnalités Principales

*   🩺 **Diagnostic d'environnement intelligent** : TexRapide vérifie automatiquement si tous vos outils LaTeX sont correctement installés et configurés.
*   🚀 **Initialisation via Templates** : Créez de nouveaux projets en un clic à partir de modèles prédéfinis.
*   🔄 **Compilation "Watch" en temps réel** : Sauvegardez votre fichier `.tex`, le PDF se recompile tout seul en arrière-plan.
*   👁️ **Aperçu dynamique** : Intégration fluide avec des lecteurs PDF externes (Skim sur Mac, SumatraPDF sur Windows) pour rafraîchir le document sans verrouillage.
*   💻 **Multiplateforme natif** : Poids plume et performances maximales grâce à Tauri v2.

---

## 📋 Prérequis Système

TexRapide repose sur trois piliers essentiels qui doivent être installés sur votre système pour pouvoir compiler vos projets `.tex` et profiter de l'aperçu automatique :

1. **Une Distribution LaTeX** : Le moteur de base (ex: `pdflatex` ou `lualatex`) pour comprendre et compiler le code.
2. **Des Outils CLI (`latexmk`, `perl`)** : Indispensables pour automatiser la chaîne de compilation.
3. **Un Lecteur PDF externe** : Pour rafraîchir l'aperçu en direct sans verrouiller le fichier PDF.

Voici la configuration recommandée selon votre système :

### 🍎 Sur macOS
Nous recommandons d'utiliser le gestionnaire de paquets **Homebrew**.
* **Distribution & CLI** : MacTeX (complet) ou BasicTeX (léger).
  ```bash
  brew install --cask mactex
  ```
* **Lecteur PDF** : Skim.
  ```bash
  brew install --cask skim
  ```

### 🪟 Sur Windows
Nous recommandons d'utiliser **winget** (intégré à Windows 10/11).
* **Distribution** : MiKTeX.
* **Outils CLI (Perl)** : Strawberry Perl (requis par MiKTeX pour l'outil `latexmk`).
* **Lecteur PDF** : SumatraPDF.

Vous pouvez tout installer en une seule commande depuis PowerShell :
```powershell
winget install MiKTeX.MiKTeX StrawberryPerl.StrawberryPerl SumatraPDF.SumatraPDF
```

> [!WARNING]
> **IMPORTANT (Spécialement sur Windows)** : Après l'installation de ces outils, vous devez **impérativement redémarrer votre terminal**, votre éditeur de code, voire votre ordinateur. Cela permet au système de mettre à jour ses variables d'environnement (`PATH`) pour que TexRapide puisse les détecter.

---

## 🚀 Démarrage Rapide

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

## 🛠️ Architecture Technique

TexRapide est construit avec une architecture moderne séparant le frontend du système :
*   **Frontend** : React, TailwindCSS, TypeScript (Géré via Vite)
*   **Backend / Core** : Rust (Tauri v2)
*   **Communication** : Tauri IPC (Inter-Process Communication)

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
