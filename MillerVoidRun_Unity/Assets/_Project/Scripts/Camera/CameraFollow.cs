using UnityEngine;

namespace VoidRun.CameraSystem
{
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new Vector3(0f, 4.1f, -6.2f);
        [SerializeField] private float smoothSpeed = 10f;
        private float shakeMagnitude;

        public void TriggerShake(float intensity = 0.35f) => shakeMagnitude = Mathf.Max(shakeMagnitude, intensity);

        private void LateUpdate()
        {
            if (target == null) return;
            Vector3 desired = new Vector3(target.position.x * 0.45f, target.position.y * 0.25f + offset.y, target.position.z + offset.z);
            if (shakeMagnitude > 0.01f)
            {
                desired += Random.insideUnitSphere * shakeMagnitude;
                shakeMagnitude = Mathf.MoveTowards(shakeMagnitude, 0f, Time.unscaledDeltaTime * 1.8f);
            }
            transform.position = Vector3.Lerp(transform.position, desired, smoothSpeed * Time.deltaTime);
            transform.LookAt(new Vector3(target.position.x * 0.2f, target.position.y + 1.3f, target.position.z + 12f));
        }
    }
}
