using System.Collections.Generic;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Gameplay;

namespace VoidRun.Virality
{
    /// <summary>
    /// Records lightweight ~2 KB Ghost Challenge streams, tracks Hype Score for Best Moment bookmarks,
    /// and invokes native Android share intents for "Beat My Distance" deep links (voidrun://challenge).
    /// </summary>
    public class GhostAndClipRecorder : MonoBehaviour
    {
        [SerializeField] private PlayerController player;
        [SerializeField] private float sampleInterval = 0.2f;

        private readonly List<GhostSample> currentRecording = new List<GhostSample>();
        private float sampleTimer;
        public float HypeScore { get; private set; }
        public float BestHypeScore { get; private set; }
        public string BestMomentLabel { get; private set; } = "Epic Void Run";

        private void Update()
        {
            if (player == null || GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Running) return;

            HypeScore = Mathf.Max(0f, HypeScore - 4f * Time.deltaTime);

            sampleTimer += Time.deltaTime;
            if (sampleTimer >= sampleInterval)
            {
                sampleTimer = 0f;
                currentRecording.Add(new GhostSample
                {
                    distance = Mathf.RoundToInt(player.transform.position.z),
                    lane = (int)player.GetCurrentLane(),
                    state = player.GetState() == PlayerActionState.Jumping ? 1 : player.GetState() == PlayerActionState.Sliding ? 2 : 0
                });
            }
        }

        public void AddHype(float points, string label)
        {
            HypeScore += points;
            if (HypeScore >= 50f && HypeScore > BestHypeScore)
            {
                BestHypeScore = HypeScore;
                BestMomentLabel = label;
            }
        }

        public void SaveIfPersonalBest(int distance)
        {
            if (distance >= SaveSystem.Data.bestDistance)
            {
                SaveSystem.Data.bestGhost = new List<GhostSample>(currentRecording);
                SaveSystem.Save();
            }
        }

        public void ShareBeatMyDistance(int distance, int seed)
        {
            string nameEncoded = UnityEngine.Networking.UnityWebRequest.EscapeURL(SaveSystem.Data.playerName);
            string deepLink = $"voidrun://challenge?d={distance}&u={nameEncoded}&seed={seed}";
            string message = $"I ran {distance}m in MILLER: VOID RUN! Can you beat my ghost? {deepLink}";

#if UNITY_ANDROID && !UNITY_EDITOR
            using (AndroidJavaClass intentClass = new AndroidJavaClass("android.content.Intent"))
            using (AndroidJavaObject intent = new AndroidJavaObject("android.content.Intent"))
            {
                intent.Call<AndroidJavaObject>("setAction", intentClass.GetStatic<string>("ACTION_SEND"));
                intent.Call<AndroidJavaObject>("setType", "text/plain");
                intent.Call<AndroidJavaObject>("putExtra", intentClass.GetStatic<string>("EXTRA_TEXT"), message);
                using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using (AndroidJavaObject activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
                using (AndroidJavaObject chooser = intentClass.CallStatic<AndroidJavaObject>("createChooser", intent, "Challenge a Friend"))
                {
                    activity.Call("startActivity", chooser);
                }
            }
#else
            GUIUtility.systemCopyBuffer = message;
            Debug.Log($"[Virality] Copied challenge share link to clipboard: {message}");
#endif
        }
    }
}
