// Firebase web config is public identification, NOT a secret. Access must be guarded by Auth + Security Rules.
// Project inherited for A/C LIMITS data compatibility; Lite flights are isolated under lite_flights.
window.SAGS_LITE_CONFIG = Object.freeze({
  firebase: {
    apiKey: 'AIzaSyCImOnRxvqbL-sRGbiS2eFE_Wmvktgc8oI',
    authDomain: 'e-report-sags.firebaseapp.com',
    databaseURL: 'https://e-report-sags-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'e-report-sags',
    appId: '1:670672018280:web:46c336986ecdbbc6a954dd'
  },
  sourceCommit: '41ad37fc9033f160fd00c21008ff9711ddfd7294',
  sourceRepo: 'sagsdieuhanh-gif/E-REPORT-SAGS',
  enableLegacyLimitsWrites: false, // turn on only after verifying existing DB permissions
  testMode: false
});