In programming—and especially in React—a **Pure Function** is a function that is predictable, consistent, and "polite" (it doesn't mess with anything outside of itself).

To be considered "pure," a function must satisfy two strict rules:

### 1. Same Input = Same Output

Every time you call the function with the same arguments, it returns exactly the same result. It doesn't rely on hidden state, external variables that might change, or random numbers.

### 2. No Side Effects

The function does not modify any variables outside of its scope. It doesn't change global variables, it doesn't mutate the objects passed into it, and it doesn't perform "noisy" actions like writing to a database or logging to the console (technically).

---

## Pure vs. Impure: A Comparison

### The Pure Version

This is predictable. If you pass `2` and `3`, you get `5`. Every. Single. Time.

```javascript
function add(a, b) {
  return a + b;
}

```

### The Impure Version

This is unpredictable. The result depends on something outside the function's control.

```javascript
let tax = 0.5;

function calculateTotal(price) {
  return price + tax; // Dependency on external 'tax' variable
}

```

*If someone changes `tax` to 0.7 elsewhere in the code, `calculateTotal(10)` will suddenly return a different answer.*

---

## Why does React care so much?

React is designed around the concept of **UI as a function of state**.

$$UI = f(state)$$

If your components (which are just functions) are "pure," React can perform some incredible optimizations:

* **Memoization:** If React knows a component is pure, it can skip re-rendering it if the props haven't changed. Why do the work twice if the result is guaranteed to be the same?
* **Concurrent Rendering:** React can pause and restart rendering. If a function is pure, React can stop halfway through, go do something else, and come back later to finish without breaking anything.
* **SSR (Server Side Rendering):** Pure functions are easy to run on a server because they don't depend on browser-specific globals (like `window` or `localStorage`).

---

## Real-World React Example

### ❌ Impure Component (The "Buggy" Way)

```jsx
let guestCount = 0;

function Cup() {
  // Bad! This changes a variable outside the function during render
  guestCount = guestCount + 1;
  return <h2>Tea cup for guest #{guestCount}</h2>;
}

```

If you render this component, and `React.StrictMode` (as we discussed earlier) double-renders it to check for purity, your guest numbers will skip: Guest #2, Guest #4, etc.

### ✅ Pure Component (The "React" Way)

```jsx
function Cup({ guestCount }) {
  // Good! It just uses the prop it was given
  return <h2>Tea cup for guest #{guestCount}</h2>;
}

```

## Summary Checklist

| Feature | Pure Function | Impure Function |
| --- | --- | --- |
| **Predictability** | 100% | Low |
| **Side Effects** | None | Possible (API calls, state changes) |
| **Testing** | Very easy | Difficult (requires "mocking") |
| **Cacheable** | Yes | No |

Does this help clarify why your console logs might have been appearing twice in Strict Mode? It's React's way of "stress-testing" your functions to see if they're actually pure!