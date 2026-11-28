

WITH latest_checkpoint AS (
  SELECT
    thread_id,
    checkpoint_id,
    checkpoint->'channel_versions'->>'messages' AS messages_version,
    metadata->>'user_id' AS user_id,
    metadata->>'langgraph_user_id' AS langgraph_user_id
  FROM checkpoints
  WHERE thread_id = 'e2e-checkpoint-1795852103:da04f77f'  -- e.g. e2e-checkpoint-1795852103:da04f77f
  ORDER BY checkpoint_id DESC
  LIMIT 1
)
SELECT
  lc.thread_id,
  lc.checkpoint_id,
  lc.messages_version,
  lc.user_id,
  t.title,
  cb.type,
  length(cb.blob) AS blob_bytes,
  -- readable-ish preview (not a clean transcript)
  left(encode(cb.blob, 'escape'), 2000) AS blob_preview
FROM latest_checkpoint lc
JOIN chatup_threads t ON t.thread_id = lc.thread_id
LEFT JOIN checkpoint_blobs cb
  ON cb.thread_id = lc.thread_id
 AND cb.channel = 'messages'
 AND cb.version = lc.messages_version;
