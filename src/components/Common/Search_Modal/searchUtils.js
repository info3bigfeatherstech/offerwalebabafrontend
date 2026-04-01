export function debounce(func, delay, immediate = false) {
  let timeoutId;
  let lastArgs;
  let lastThis;
  
  return function(...args) {
    lastArgs = args;
    lastThis = this;
    
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(lastThis, lastArgs);
      }
    }, delay);
    
    if (callNow) {
      func.apply(lastThis, lastArgs);
    }
  };
}

export function throttle(func, limit, options = { leading: true, trailing: true }) {
  let inThrottle;
  let lastResult;
  let lastFunc;
  
  return function(...args) {
    if (!inThrottle) {
      if (options.leading) {
        lastResult = func.apply(this, args);
      }
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (options.trailing && lastFunc) {
          lastResult = lastFunc.apply(this, args);
          lastFunc = null;
        }
      }, limit);
    } else if (options.trailing) {
      lastFunc = () => func.apply(this, args);
    }
    
    return lastResult;
  };
}

export class SearchCache {
  constructor(ttl = 300000, maxSize = 50) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}