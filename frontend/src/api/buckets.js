const API_URL = 'http://localhost:9080'

async function parseJsonOrThrow(response) {
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`)
  }
  return response.json()
}

export function fetchBuckets() {
  return fetch(`${API_URL}/buckets`).then(parseJsonOrThrow)
}

export function createBucket(bucket) {
  return fetch(`${API_URL}/buckets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bucket),
  }).then(parseJsonOrThrow)
}

export function updateBucket(id, bucket) {
  return fetch(`${API_URL}/buckets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bucket),
  }).then(parseJsonOrThrow)
}

export function deleteBucket(id) {
  return fetch(`${API_URL}/buckets/${id}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Requisição falhou com status ${response.status}`)
    }
  })
}
