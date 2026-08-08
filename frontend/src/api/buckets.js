import { fetchJson } from './config'

export function fetchBuckets() {
  return fetchJson('/buckets')
}

export function createBucket(bucket) {
  return fetchJson('/buckets', { method: 'POST', body: JSON.stringify(bucket) })
}

export function updateBucket(id, bucket) {
  return fetchJson(`/buckets/${id}`, { method: 'PUT', body: JSON.stringify(bucket) })
}

export function setDefaultBucket(id) {
  return fetchJson(`/buckets/${id}/default`, { method: 'PUT' })
}

export function deleteBucket(id) {
  return fetchJson(`/buckets/${id}`, { method: 'DELETE' })
}
