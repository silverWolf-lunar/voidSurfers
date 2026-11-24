using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VoidRun.Core;
using VoidRun.Abilities;
using VoidRun.Chaser;

namespace VoidRun.UI
{
    public class HUDController : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI multiplierText;
        [SerializeField] private TextMeshProUGUI distanceText;
        [SerializeField] private TextMeshProUGUI shardText;
        [SerializeField] private TextMeshProUGUI worldText;
        [SerializeField] private Slider veSlider;
        [SerializeField] private Slider chaserSlider;
        [SerializeField] private Button voidPowerButton;
        [SerializeField] private GameObject gameOverPanel;

        [SerializeField] private AbilitySystem abilitySystem;
        [SerializeField] private ChaserController chaser;

        private float lastVoidTapTime;

        private void Start()
        {
            if (voidPowerButton != null)
            {
                voidPowerButton.onClick.AddListener(OnVoidButtonClicked);
            }
            if (abilitySystem != null)
            {
                abilitySystem.OnEnergyChanged += (cur, max) =>
                {
                    if (veSlider != null) veSlider.value = max > 0 ? cur / max : 0f;
                };
            }
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnRunGameOver += () =>
                {
                    if (gameOverPanel != null) gameOverPanel.SetActive(true);
                };
            }
        }

        private void Update()
        {
            if (GameManager.Instance == null) return;
            if (scoreText != null) scoreText.text = $"{GameManager.Instance.RunScore:N0}";
            if (multiplierText != null) multiplierText.text = $"x{GameManager.Instance.ScoreMultiplier}";
            if (distanceText != null) distanceText.text = $"{Mathf.FloorToInt(GameManager.Instance.RunDistance):N0} m";
            if (shardText != null) shardText.text = $"{GameManager.Instance.RunVoidShards} VS";
            var w = GameManager.Instance.GetCurrentWorldData();
            if (worldText != null && w != null) worldText.text = $"W{w.worldIndex} · {w.worldName}";
            if (chaserSlider != null && chaser != null)
            {
                chaserSlider.value = Mathf.Clamp01((60f - chaser.CurrentDistance) / 60f);
            }
        }

        private void OnVoidButtonClicked()
        {
            float now = Time.unscaledTime;
            if (now - lastVoidTapTime < 0.28f)
            {
                abilitySystem?.SwapAbilitySlot();
                lastVoidTapTime = 0f;
            }
            else
            {
                lastVoidTapTime = now;
                abilitySystem?.TriggerEquippedAbility();
            }
        }

        public void OnClickReviveAd()
        {
            VoidRunServices.Instance?.ShowRewarded("Revive", () =>
            {
                if (gameOverPanel != null) gameOverPanel.SetActive(false);
                chaser?.ResetToDistant();
            });
        }

        public void OnClickRestart() => GameManager.Instance?.StartNewRun(GameManager.Instance.CurrentWorldIndex);
    }
}
