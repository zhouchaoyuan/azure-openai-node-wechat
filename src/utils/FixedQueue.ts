export class FixedQueue<T> {
  private queue: T[]
  private maxLength: number

  constructor(maxLength: number) {
    this.queue = []
    this.maxLength = maxLength
  }

  enqueue(item: T): void {
    if (this.queue.length >= this.maxLength)
      this.dequeue()

    this.queue.push(item)
  }

  dequeue(): T | undefined {
    return this.queue.shift()
  }

  peek(): T | undefined {
    return this.queue[0]
  }

  clear(): void {
    this.queue = []
  }

  get length(): number {
    return this.queue.length
  }

  toArray(): T[] {
    return Array.from(this.queue)
  }
}
