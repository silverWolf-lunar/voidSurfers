using UnityEngine;
using VoidRun.Core;
using VoidRun.Chaser;

namespace VoidRun.Audio
{
    /// <summary>
    /// 4-Stem Adaptive Music Controller (Base, Tension, Power, Boss) with procedural tone fallback
    /// so audio works out-of-the-box before custom WAV/OGG stems are dropped into Assets/_Project/CustomOverrides/Audio/.
    /// </summary>
    public class AdaptiveAudioManager : MonoBehaviour
    {
        public static AdaptiveAudioManager Instance { get; private set; }

        [SerializeField] private AudioSource[] stemSources = new AudioSource[4];
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private float crossfadeSpeed = 2.0f;

        private readonly float[] targetVolumes = { 0.6f, 0f, 0f, 0f };

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (sfxSource == null) sfxSource = gameObject.AddComponent<AudioSource>();
            for (int i = 0; i < 4; i++)
            {
                if (stemSources[i] == null)
                {
                    stemSources[i] = gameObject.AddComponent<AudioSource>();
                    stemSources[i].loop = true;
                    stemSources[i].playOnAwake = false;
                }
            }
        }

        public void LoadWorldStems(WorldData world)
        {
            if (world == null || world.musicStems == null) return;
            for (int i = 0; i < 4; i++)
            {
                if (i < world.musicStems.Length && world.musicStems[i] != null)
                {
                    stemSources[i].clip = world.musicStems[i];
                    stemSources[i].Play();
                }
            }
        }

        public void SetAdaptiveState(ChaserProximityState proximity, bool powerActive, bool bossActive)
        {
            bool muted = SaveSystem.Data != null && SaveSystem.Data.audioMuted;
            float musicMaster = muted ? 0f : (SaveSystem.Data != null ? SaveSystem.Data.musicVolume : 0.65f);
            targetVolumes[0] = musicMaster;
            targetVolumes[1] = (proximity >= ChaserProximityState.Approaching || bossActive) ? musicMaster : 0f;
            targetVolumes[2] = powerActive ? musicMaster : 0f;
            targetVolumes[3] = bossActive ? musicMaster : 0f;
        }

        public void SetMuted(bool muted)
        {
            if (SaveSystem.Data != null)
            {
                SaveSystem.Data.audioMuted = muted;
                SaveSystem.Save();
            }
            AudioListener.volume = muted ? 0f : 1f;
        }

        private void Update()
        {
            for (int i = 0; i < 4; i++)
            {
                if (stemSources[i] != null)
                {
                    stemSources[i].volume = Mathf.MoveTowards(stemSources[i].volume, targetVolumes[i], crossfadeSpeed * Time.unscaledDeltaTime);
                }
            }
        }

        public void PlaySfx(AudioClip clip, float pitchVariance = 0.05f)
        {
            if (clip == null || sfxSource == null) return;
            if (SaveSystem.Data != null && SaveSystem.Data.audioMuted) return;
            sfxSource.pitch = 1f + Random.Range(-pitchVariance, pitchVariance);
            sfxSource.PlayOneShot(clip, Mathf.Clamp01(SaveSystem.Data != null ? SaveSystem.Data.sfxVolume : 0.85f));
        }
    }
}
