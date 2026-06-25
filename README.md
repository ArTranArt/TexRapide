# TexRapide ⚡️

**TexRapide** est un gestionnaire et centre de contrôle desktop pour vos projets LaTeX sur macOS et Windows, développé avec **Tauri v2**, **React** et **TailwindCSS**. Il propose un diagnostic d'environnement, l'initialisation de projets via templates et une compilation/aperçu automatique (via Skim sur Mac ou SumatraPDF sur Windows) en mode "Watch" en temps réel.

---

## 📋 Prérequis

Pour utiliser et développer TexRapide, plusieurs prérequis sont nécessaires selon votre cas d'usage.

### 1. Pour l'Utilisation (Compilation LaTeX & Aperçu)
Pour pouvoir compiler vos projets `.tex` et profiter de l'aperçu automatique, vous devez disposer des outils système suivants :

*   **Une distribution LaTeX** :
    *   **macOS** : **MacTeX** (recommandé) ou **BasicTeX** (léger). *Installation via Homebrew :* `brew install --cask mactex`
    *   **Windows** : **MiKTeX** (recommandé). Vous aurez aussi besoin de **Strawberry Perl** pour que `latexmk` fonctionne. *Installation via winget :* `winget install MiKTeX.MiKTeX StrawberryPerl.StrawberryPerl`
*   **Outils LaTeX en ligne de commande** (doivent être disponibles dans votre `PATH`) :
    *   `pdflatex` (compilateur de base)
    *   `latexmk` (utilisé par le mode Watch de l'app pour automatiser la chaîne de compilation)
    *   `bibtex` (gestionnaire de bibliographies)
*   **Lecteur PDF (Recommandé)** :
    *   L'application utilise un lecteur externe pour afficher et rafraîchir en direct le PDF compilé sans verrouiller le fichier.
    *   **macOS** : **Skim** - `brew install --cask skim`
    *   **Windows** : **SumatraPDF** - `winget install SumatraPDF.SumatraPDF`

---

### 2. Pour les Développeurs (Lancement & Compilation locale)
Si vous souhaitez lancer l'application en mode développement ou compiler un binaire :

*   **Node.js & pnpm** :
    *   **Node.js** (LTS >= 18 ou 20 recommandé)
    *   **pnpm** (installateur de paquets)
*   **Outils de compilation C++** :
    *   **macOS** : **Xcode Command Line Tools** (`xcode-select --install`)
    *   **Windows** : **Visual Studio Build Tools** (avec charge de travail C++)
*   **Rust** :
    *   Le compilateur Rust (installé via [rustup](https://rustup.rs/)) : `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (sur macOS/Linux) ou téléchargez `rustup-init.exe` sur Windows.

---

## 🚀 Démarrage Rapide

1. **Installer les dépendances frontend** :
   ```bash
   pnpm install
   ```

2. **Lancer l'application en mode développement** :
   ```bash
   pnpm run tauri dev
   ```

3. **Compiler l'application pour la production** :
   ```bash
   pnpm run tauri build
   ```

---

## 🛠️ Configuration Recommandée de l'IDE

Pour développer sur ce projet, nous recommandons d'utiliser **VS Code** avec les extensions suivantes :
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
