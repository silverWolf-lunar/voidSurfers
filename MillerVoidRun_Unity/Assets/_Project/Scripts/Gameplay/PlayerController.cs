using System;
using System.Collections;
using UnityEngine;
using VoidRun.Core;

namespace VoidRun.Gameplay
{
    public enum Lane { Left = 0, Center = 1, Right = 2 }
    public enum PlayerActionState { Running, Jumping, Sliding, Stumbling }

    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Lane Geometry (3.6m Track)")]
        [SerializeField] private float laneDistance = 1.2f;
        [SerializeField] private float laneChangeSpeed = 15f;
        private Lane currentLane = Lane.Center;
        private float targetXPosition = 0f;

        [Header("Movement & Speed")]
        [SerializeField] private float baseForwardSpeed = 12f;
        private float currentForwardSpeed;
        private CharacterController characterController;

        [Header("Jump & Slide")]
        [SerializeField] private float jumpHeight = 1.75f;
        [SerializeField] private float gravity = 32f;
        [SerializeField] private float slideDuration = 0.5f;
        private float verticalVelocity = 0f;
        private PlayerActionState currentState = PlayerActionState.Running;

        [Header("Forgiving Hitboxes (GDD Section C)")]
        [SerializeField] private Vector3 standingCenter = new Vector3(0, 0.75f, 0);
        [SerializeField] private float standingHeight = 1.5f;
        [SerializeField] private Vector3 slidingCenter = new Vector3(0, 0.25f, 0);
        [SerializeField] private float slidingHeight = 0.5f;

        [Header("Input Buffer (150ms) & Swipe Thresholds")]
        [SerializeField] private float bufferWindow = 0.15f;
        [SerializeField] private float minSwipePixels = 40f;
        [SerializeField] private float maxSwipeDuration = 0.35f;
        private Action bufferedAction;
        private float bufferTimer;
        private Vector2 touchStartPos;
        private float touchStartTime;
        private bool isTrackingTouch;

        [Header("Status & Passives")]
        private bool isInvulnerable;
        private bool isHovering;
        private bool firstObstaclePhaseAvailable;
        private bool secondChanceUsed;
        public int ShieldHits { get; set; }
        public bool ConceptReversalActive { get; set; }
        public bool IcePhysicsActive { get; set; }
        public bool ControlsInverted { get; set; }
        public float SpeedMultiplier { get; set; } = 1f;

        public event Action OnStumble;
        public event Action OnFatalHit;
        public event Action<int> OnNearMiss;

        private int nearMissCombo;
        private float nearMissResetTimer;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            currentForwardSpeed = baseForwardSpeed;
            targetXPosition = GetLaneX(currentLane);
            firstObstaclePhaseAvailable = SaveSystem.Data != null && SaveSystem.Data.selectedRunner == RunnerId.Rumbidzai;
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Running
                && GameManager.Instance.CurrentState != GameState.BossChase) return;

            PollInputs();
            HandleBufferedInput();
            HandleVerticalMotion();
            ApplyMovement();

            if (nearMissResetTimer > 0f)
            {
                nearMissResetTimer -= Time.deltaTime;
                if (nearMissResetTimer <= 0f) nearMissCombo = 0;
            }

            GameManager.Instance?.UpdateDistance(transform.position.z);
        }

        private void PollInputs()
        {
            // Touch swipe (Portrait One-Thumb)
            if (Input.touchCount > 0)
            {
                Touch t = Input.GetTouch(0);
                if (t.phase == TouchPhase.Began)
                {
                    touchStartPos = t.position;
                    touchStartTime = Time.unscaledTime;
                    isTrackingTouch = true;
                }
                else if (t.phase == TouchPhase.Ended && isTrackingTouch)
                {
                    isTrackingTouch = false;
                    Vector2 delta = t.position - touchStartPos;
                    if (delta.magnitude >= minSwipePixels && (Time.unscaledTime - touchStartTime) <= maxSwipeDuration)
                    {
                        if (Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
                            RequestMoveLane(delta.x > 0 ? 1 : -1);
                        else if (delta.y > 0)
                            RequestJump();
                        else
                            RequestSlide();
                    }
                }
            }

            // Editor / Keyboard testing support
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A)) RequestMoveLane(-1);
            if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D)) RequestMoveLane(1);
            if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.W)) RequestJump();
            if (Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.S)) RequestSlide();
        }

        public void SetSpeed(float newSpeed) => currentForwardSpeed = newSpeed;
        public float GetCurrentSpeed() => currentForwardSpeed * SpeedMultiplier;
        public PlayerActionState GetState() => currentState;
        public Lane GetCurrentLane() => currentLane;
        public void SetInvulnerability(bool state) => isInvulnerable = state;
        public void SetHovering(bool state) => isHovering = state;

        public void RequestMoveLane(int direction)
        {
            if (ControlsInverted) direction = -direction;
            if (currentState == PlayerActionState.Stumbling)
            {
                BufferAction(() => RequestMoveLane(direction));
                return;
            }
            int nextLane = Mathf.Clamp((int)currentLane + direction, 0, 2);
            currentLane = (Lane)nextLane;
            targetXPosition = GetLaneX(currentLane);
        }

        public void RequestJump()
        {
            if (currentState == PlayerActionState.Sliding) StopCoroutine(nameof(SlideRoutine));
            if (characterController.isGrounded && currentState != PlayerActionState.Stumbling)
            {
                verticalVelocity = Mathf.Sqrt(2f * jumpHeight * gravity);
                currentState = PlayerActionState.Jumping;
                characterController.center = standingCenter;
                characterController.height = standingHeight;
            }
            else
            {
                BufferAction(RequestJump);
            }
        }

        public void RequestSlide()
        {
            if (currentState == PlayerActionState.Jumping) verticalVelocity = -gravity * 0.55f;
            if (currentState != PlayerActionState.Stumbling)
            {
                StopCoroutine(nameof(SlideRoutine));
                StartCoroutine(nameof(SlideRoutine));
            }
            else
            {
                BufferAction(RequestSlide);
            }
        }

        private void BufferAction(Action action)
        {
            bufferedAction = action;
            bufferTimer = bufferWindow;
        }

        private void HandleBufferedInput()
        {
            if (bufferedAction == null) return;
            bufferTimer -= Time.deltaTime;
            if (bufferTimer <= 0f)
            {
                bufferedAction = null;
                return;
            }
            if (characterController.isGrounded && currentState == PlayerActionState.Running)
            {
                Action act = bufferedAction;
                bufferedAction = null;
                act?.Invoke();
            }
        }

        private void HandleVerticalMotion()
        {
            if (isHovering)
            {
                verticalVelocity = (0.85f - transform.position.y) * 10f;
                return;
            }
            if (characterController.isGrounded)
            {
                if (verticalVelocity < 0f) verticalVelocity = -1f;
                if (currentState == PlayerActionState.Jumping) currentState = PlayerActionState.Running;
            }
            else
            {
                verticalVelocity -= gravity * Time.deltaTime;
            }
        }

        private void ApplyMovement()
        {
            float effLaneSpeed = laneChangeSpeed;
            if (SaveSystem.Data != null && SaveSystem.Data.selectedRunner == RunnerId.Rumbidzai) effLaneSpeed *= 1.3f;
            if (IcePhysicsActive) effLaneSpeed *= 0.65f;

            Vector3 cur = transform.position;
            float newX = Mathf.MoveTowards(cur.x, targetXPosition, effLaneSpeed * Time.deltaTime);
            Vector3 motion = new Vector3(newX - cur.x, verticalVelocity * Time.deltaTime, GetCurrentSpeed() * Time.deltaTime);
            characterController.Move(motion);
        }

        private float GetLaneX(Lane lane) => ((int)lane - 1) * laneDistance;

        private IEnumerator SlideRoutine()
        {
            currentState = PlayerActionState.Sliding;
            characterController.center = slidingCenter;
            characterController.height = slidingHeight;
            yield return new WaitForSeconds(IcePhysicsActive ? slideDuration * 1.2f : slideDuration);
            characterController.center = standingCenter;
            characterController.height = standingHeight;
            if (currentState == PlayerActionState.Sliding) currentState = PlayerActionState.Running;
        }

        public void RegisterNearMiss()
        {
            nearMissCombo++;
            nearMissResetTimer = 2.0f;
            GameManager.Instance?.RecordNearMiss();
            OnNearMiss?.Invoke(nearMissCombo);
            StartCoroutine(NearMissSlowMoRoutine());
        }

        private IEnumerator NearMissSlowMoRoutine()
        {
            if (Time.timeScale < 0.6f) yield break; // Don't override Time Bleed
            Time.timeScale = 0.72f;
            yield return new WaitForSecondsRealtime(0.32f);
            Time.timeScale = 1f;
        }

        public void TakeObstacleHit(bool isOverhead = false)
        {
            if (ConceptReversalActive)
            {
                GameManager.Instance?.AddShard(5);
                return;
            }
            if (isInvulnerable) return;

            // Ruth Swait passive: shatter overhead obstacles
            if (isOverhead && SaveSystem.Data != null && SaveSystem.Data.selectedRunner == RunnerId.Ruth)
            {
                GameManager.Instance?.AddShard(2);
                return;
            }

            if (firstObstaclePhaseAvailable)
            {
                firstObstaclePhaseAvailable = false;
                return;
            }

            if (ShieldHits > 0)
            {
                ShieldHits--;
                return;
            }

            if (currentState == PlayerActionState.Stumbling)
            {
                if (SaveSystem.HasSkillNode("shadow_2nd") && !secondChanceUsed)
                {
                    secondChanceUsed = true;
                    currentState = PlayerActionState.Running;
                    StartCoroutine(TempInvuln(2f));
                    return;
                }
                OnFatalHit?.Invoke();
                GameManager.Instance?.TriggerGameOver();
            }
            else
            {
                StartCoroutine(StumbleRoutine());
            }
        }

        private IEnumerator TempInvuln(float seconds)
        {
            isInvulnerable = true;
            yield return new WaitForSeconds(seconds);
            isInvulnerable = false;
        }

        private IEnumerator StumbleRoutine()
        {
            currentState = PlayerActionState.Stumbling;
            float orig = currentForwardSpeed;
            currentForwardSpeed *= 0.78f;
            OnStumble?.Invoke();

            float dur = 0.45f;
            if (SaveSystem.Data != null && SaveSystem.Data.selectedRunner == RunnerId.Precious) dur *= 0.7f;
            if (SaveSystem.HasSkillNode("shadow_rec")) dur = Mathf.Max(0.2f, dur - 0.1f);
            yield return new WaitForSeconds(dur);

            currentForwardSpeed = orig;
            currentState = PlayerActionState.Running;
        }
    }
}
