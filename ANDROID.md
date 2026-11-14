# iHatePDF for Android

The app is the same client-side web app wrapped with [Capacitor](https://capacitorjs.com).
Your files are still processed on the device; nothing is uploaded.

## Get the APK (no Android Studio needed)

1. Push this repo to your GitHub account.
2. Open the **Actions** tab, pick **Build Android APK**, and press **Run workflow**.
3. When it finishes (about 5 to 10 minutes), open the run and download the
   **iHatePDF-apk** artifact. Unzip it to get `iHatePDF.apk`.
4. Copy the APK to your phone and open it. Android will ask you to allow
   installs from that source.

To publish the APK as a downloadable release instead, push a version tag:

```
git tag v3.0.0
git push origin v3.0.0
```

The APK is then attached to the GitHub release for that tag.

## Build locally

Requires Node 22+, JDK 21 and the Android SDK.

```
npm install
npx cap add android      # first time only
npm run android:sync     # builds the web app and copies it into android/
cd android && ./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
Or run `npx cap open android` to open the project in Android Studio.

## Notes

- **Saving files:** Android WebViews can't download generated files directly, so
  inside the app the Download buttons open the system share sheet. Pick
  "Save to Files" (or Drive, WhatsApp, etc.) to keep the result.
- **Debug signing:** the workflow produces a debug-signed APK, which installs
  fine for personal use. A Play Store release needs your own signing key.
- **Fonts:** Inter and Poppins load from Google Fonts, so the first launch
  needs a connection to get them; offline it falls back to system fonts.
