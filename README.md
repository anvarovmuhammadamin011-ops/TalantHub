# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Android app

The `android/` folder is a Capacitor-wrapped native project. To build the APK you need locally installed:

- [Android Studio](https://developer.android.com/studio) (includes the Android SDK)
- a JDK (Android Studio can install one, or use `JAVA_HOME` if you already have one)

Steps:

1. Copy `.env.example` to `.env` and set `VITE_API_URL` to your backend's LAN IP or deployed URL (a phone can't reach `localhost` on your PC).
2. `npm run android:sync` — builds the web app and copies it into the native project.
3. `npm run android:open` — opens the project in Android Studio, or run `npm run android:run` to build and launch on a connected device/emulator directly.
4. In Android Studio: **Build → Generate Signed Bundle / APK** to produce a release APK, or use the Run button for a debug build.
