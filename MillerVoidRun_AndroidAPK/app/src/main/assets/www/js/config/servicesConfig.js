// MILLER: VOID RUN — Online Services, AdMob, Play Billing, Firebase & Drop-In Asset Adapter
// Runs 100% offline in Mock Mode by default. Paste your real keys below to activate live SDKs.

export const SERVICE_CONFIG = {
  mode: 'offline_mock', // Switch to 'live' once keys are populated
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
  admob: {
    androidAppId: '',
    rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917', // Google Test ID
    interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  },
  playBilling: {
    publicLicenseKey: '',
  },
  customAssets: {
    // Drop custom .glb models or .ogg/.wav files into www/assets/custom/ and list them here
    models: {
      // miller: 'assets/custom/models/miller.glb',
    },
    audio: {
      // world1_music: 'assets/custom/audio/world1_base.ogg',
    },
  },
};

const isAndroidNative = () => typeof window !== 'undefined' && typeof window.AndroidBridge !== 'undefined';

export const NativeBridge = {
  isNative: isAndroidNative,

  vibrate(ms = 35) {
    try {
      if (isAndroidNative() && window.AndroidBridge.vibrate) {
        window.AndroidBridge.vibrate(ms);
      } else if (navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (_) {}
  },

  shareText(title, text) {
    try {
      if (isAndroidNative() && window.AndroidBridge.shareText) {
        window.AndroidBridge.shareText(title, text);
        return true;
      }
      if (navigator.share) {
        navigator.share({ title, text }).catch(() => {});
        return true;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (_) {}
    return false;
  },

  showRewardedAd(placement, onRewarded) {
    if (isAndroidNative() && window.AndroidBridge.showRewardedAd && SERVICE_CONFIG.mode === 'live') {
      window.__onAdReward = onRewarded;
      window.AndroidBridge.showRewardedAd(placement);
      return;
    }
    // Clean offline mock rewarded ad overlay (1.5s simulated preview)
    const modal = document.getElementById('mock-ad-modal');
    const bar = document.getElementById('mock-ad-bar');
    const label = document.getElementById('mock-ad-label');
    if (!modal) {
      onRewarded();
      return;
    }
    label.textContent = `Sponsored Reward Preview (${placement})...`;
    bar.style.width = '0%';
    modal.classList.remove('hidden');
    let p = 0;
    const iv = setInterval(() => {
      p += 10;
      bar.style.width = `${p}%`;
      if (p >= 100) {
        clearInterval(iv);
        modal.classList.add('hidden');
        onRewarded();
      }
    }, 120);
  },

  purchaseIAP(pack, onSuccess) {
    if (isAndroidNative() && window.AndroidBridge.purchaseProduct && SERVICE_CONFIG.mode === 'live') {
      window.__onIapSuccess = onSuccess;
      window.AndroidBridge.purchaseProduct(pack.id);
      return;
    }
    // Ethics parental/confirmation prompt per GDD Section Q.5
    const ok = confirm(
      `[Offline Sandbox Purchase]\n\nItem: ${pack.name} (${pack.price})\n${pack.desc}\n\nConfirm simulated purchase? (No real charge in offline mode.)`
    );
    if (ok) onSuccess();
  },

  getWeeklyLeaderboard(playerBest, playerName, playerWorld) {
    // Seeded local + simulated global rivals (swapped for Firestore query in live mode)
    const rivals = [
      { name: 'VoidKing_ZA', dist: 11420, char: 'Miller', world: 7 },
      { name: 'ElytraPhantom', dist: 9850, char: 'Rumbidzai', world: 6 },
      { name: 'CodexMaster99', dist: 8340, char: 'Miller', world: 6 },
      { name: 'CrimsonHunter', dist: 6720, char: 'Ruth', world: 5 },
      { name: 'LeoMimic', dist: 5190, char: 'Leonard', world: 4 },
      { name: 'ArchiveRunner', dist: 3840, char: 'Harry', world: 3 },
      { name: 'EmberDash', dist: 2410, char: 'Precious', world: 2 },
      { name: 'GreenPortalPro', dist: 1480, char: 'Miller', world: 1 },
    ];
    rivals.push({ name: `${playerName} (You)`, dist: Math.floor(playerBest), char: 'You', world: playerWorld, isPlayer: true });
    rivals.sort((a, b) => b.dist - a.dist);
    return rivals.map((r, i) => ({ ...r, rank: i + 1 }));
  },
};
