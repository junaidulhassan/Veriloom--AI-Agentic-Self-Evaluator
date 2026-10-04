type Listener = () => void

const listeners = new Set<Listener>()

export function onUnauthorized(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyUnauthorized() {
  listeners.forEach((listener) => listener())
}
