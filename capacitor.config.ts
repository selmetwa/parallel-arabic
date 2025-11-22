import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.parallelarabic.app',
  appName: 'Parallel Arabic',
  webDir: 'build',
  server: {
    url: 'https://parallel-arabic.com',
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      ios: true,
      android: true
    }
  }
};

export default config;

