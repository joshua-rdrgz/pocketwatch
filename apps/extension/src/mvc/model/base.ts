/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class BaseModel<T = any> {
  protected state: T;
  protected subscribers: Set<(state: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  protected setState(newState: Partial<T>) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  getState(): T {
    return { ...this.state };
  }

  subscribe(callback: (state: T) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.getState()));
  }
}
