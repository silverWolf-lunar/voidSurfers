using System.Collections.Generic;
using UnityEngine;
using VoidRun.Core;
using VoidRun.Gameplay;

namespace VoidRun.Track
{
    public class TrackObstacle : MonoBehaviour
    {
        public bool isOverhead;
        public bool isIllusion;
        private bool triggered;

        public void ResetObstacle(bool overhead, bool illusion)
        {
            isOverhead = overhead;
            isIllusion = illusion;
            triggered = false;
            gameObject.SetActive(true);
        }

        private void OnTriggerEnter(Collider other)
        {
            if (triggered) return;
            var player = other.GetComponent<PlayerController>();
            if (player == null) return;
            triggered = true;

            if (isIllusion)
            {
                gameObject.SetActive(false);
                return;
            }
            player.TakeObstacleHit(isOverhead);
        }
    }

    public class TrackCollectible : MonoBehaviour
    {
        public enum Kind { VoidShard, CodexEssence, BeastCore, Magnet, Barrier, DoubleShards, VoidSurge }
        public Kind kind = Kind.VoidShard;

        private void Update()
        {
            transform.Rotate(0f, 120f * Time.deltaTime, 0f);
        }

        private void OnTriggerEnter(Collider other)
        {
            var player = other.GetComponent<PlayerController>();
            if (player == null) return;

            if (kind == Kind.VoidShard) GameManager.Instance?.AddShard(1);
            else if (kind == Kind.CodexEssence) GameManager.Instance?.AddEssence(1);
            else if (kind == Kind.BeastCore) GameManager.Instance?.AddBeastCore(1);
            else if (kind == Kind.Barrier) player.ShieldHits += 1;

            gameObject.SetActive(false);
        }
    }

    public class TrackSpawner : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Transform playerTransform;
        [SerializeField] private List<GameObject> chunkPrefabs = new List<GameObject>();

        [Header("Chunk Pooling (GDD Section E)")]
        [SerializeField] private float chunkLength = 30f;
        [SerializeField] private int activeChunkCount = 8;

        private readonly Queue<GameObject> activeChunks = new Queue<GameObject>();
        private readonly List<GameObject> chunkPool = new List<GameObject>();
        private float nextSpawnZ = 0f;

        private void Start()
        {
            if (chunkPrefabs.Count == 0)
            {
                CreateRuntimeFallbackChunk();
            }

            // Pre-warm object pool (Zero GC allocations during run loop per GDD Section W)
            for (int i = 0; i < activeChunkCount + 2; i++)
            {
                var prefab = chunkPrefabs[i % chunkPrefabs.Count];
                var inst = Instantiate(prefab, transform);
                inst.SetActive(false);
                chunkPool.Add(inst);
            }

            for (int i = 0; i < activeChunkCount; i++)
            {
                SpawnNextChunk(i < 2);
            }
        }

        private void Update()
        {
            if (playerTransform == null) return;
            if (playerTransform.position.z - (nextSpawnZ - activeChunkCount * chunkLength) > chunkLength)
            {
                RecycleOldestChunk();
                SpawnNextChunk(false);
            }
        }

        private void SpawnNextChunk(bool safeStart)
        {
            GameObject chunk = chunkPool.Count > 0 ? chunkPool[0] : Instantiate(chunkPrefabs[0], transform);
            if (chunkPool.Count > 0) chunkPool.RemoveAt(0);

            chunk.transform.position = new Vector3(0f, 0f, nextSpawnZ);
            chunk.SetActive(true);

            // Reset pooled obstacles & collectibles inside chunk
            foreach (var obs in chunk.GetComponentsInChildren<TrackObstacle>(true))
            {
                obs.ResetObstacle(obs.isOverhead, false);
                if (safeStart) obs.gameObject.SetActive(false);
            }
            foreach (var col in chunk.GetComponentsInChildren<TrackCollectible>(true))
            {
                col.gameObject.SetActive(true);
            }

            activeChunks.Enqueue(chunk);
            nextSpawnZ += chunkLength;
        }

        private void RecycleOldestChunk()
        {
            if (activeChunks.Count == 0) return;
            var old = activeChunks.Dequeue();
            old.SetActive(false);
            chunkPool.Add(old);
        }

        private void CreateRuntimeFallbackChunk()
        {
            var go = new GameObject("RuntimeChunkPrefab");
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.transform.SetParent(go.transform);
            floor.transform.localScale = new Vector3(3.8f, 0.4f, chunkLength);
            floor.transform.localPosition = new Vector3(0f, -0.2f, chunkLength * 0.5f);
            go.SetActive(false);
            chunkPrefabs.Add(go);
        }
    }
}
