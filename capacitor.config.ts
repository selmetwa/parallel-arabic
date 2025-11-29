import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.parallelarabic.app', // Your reverse-domain app ID
  appName: 'Parallel Arabic',
  webDir: 'build', // SvelteKit static build output
  server: {
    // Use your live Vercel server - the native app is just a wrapper around your web app
    url: 'https://www.parallel-arabic.com', // Replace with your actual Vercel URL
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,        // Don't auto-hide
      launchAutoHide: false,        // We'll hide it manually
      backgroundColor: '#365463',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#365463'
  }
};

export default config;