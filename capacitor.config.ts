import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.halfdiary.app',
  appName: 'Half日记',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF6F1',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FAF6F1',
    },
    Keyboard: {
      resize: 'body' as unknown as undefined,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
