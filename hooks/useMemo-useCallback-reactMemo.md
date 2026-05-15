# `React.memo`, `useMemo`, and `useCallback` in Detail

These three APIs are React's **performance optimization tools**. They all do one thing: **avoid unnecessary work** by caching (memoizing) values, functions, or entire components between renders.

> Note: There's no `useCallable` in React — I'll assume you meant **`useCallback`**, which is the standard hook.

```jsx
import { memo, useMemo, useCallback } from 'react';
```

---

## The Core Problem They Solve

Every time a React component re-renders:
1. All variables inside it are **recreated**
2. All functions inside it are **redefined** (new reference each time)
3. All child components **re-render** by default

Most of the time, this is fast and fine. But for **expensive calculations**, **large lists**, or **deeply nested components**, it can cause noticeable lag.

| Tool | What it memoizes |
|---|---|
| `React.memo` | An entire **component** (skips re-render if props are unchanged) |
| `useMemo` | A **computed value** (skips recalculation if deps unchanged) |
| `useCallback` | A **function reference** (skips recreating the function if deps unchanged) |

---

## 1. `React.memo` — Memoize a Component

### What it does
Wraps a component so it **only re-renders when its props change** (using shallow comparison). If the parent re-renders but the props passed to the child are the same, the child skips rendering entirely.

### Syntax
```jsx
const MyComponent = memo(function MyComponent(props) {
  return <div>{props.value}</div>;
});
```

### Real-world example: A user list with a search box

```jsx name=user-list.jsx
import { useState, memo } from 'react';

// Child: renders a single user card
const UserCard = memo(function UserCard({ user }) {
  console.log('Rendering UserCard:', user.name);
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

function UserList() {
  const [search, setSearch] = useState('');
  const [users] = useState([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users..."
      />
      {filtered.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

### Explanation
- Every time the user types in the search box, `UserList` re-renders (because `search` state changes).
- **Without `memo`**: Every `UserCard` would re-render too — even if its `user` prop didn't change.
- **With `memo`**: Each `UserCard` checks if its `user` prop is the same as before. If yes, it skips rendering. You'll see the `console.log` only fire when a card is *actually* added/removed/changed.

### When to use `React.memo`
✅ Component renders often with the **same props**  
✅ Component is **expensive** to render (large tree, heavy computation)  
✅ Component is in a **long list**  

❌ Don't use it everywhere — comparing props also has a cost. For tiny components, it's pointless overhead.

### Gotcha: Reference equality
`memo` uses `===` (shallow equality). So:
```jsx
<UserCard user={{ name: 'Alice' }} />  // ❌ New object every render → memo useless
```
You must pass **stable references** — which is where `useMemo` and `useCallback` come in.

---

## 2. `useMemo` — Memoize a Computed Value

### What it does
Caches the result of a calculation. Only recomputes when one of its dependencies changes.

### Syntax
```jsx
const cachedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

### Real-world example: Filtering and sorting a large product list

```jsx name=product-list.jsx
import { useState, useMemo } from 'react';

function ProductList({ products }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [theme, setTheme] = useState('light');

  // Expensive: filter + sort thousands of products
  const visibleProducts = useMemo(() => {
    console.log('Recomputing visible products...');
    return products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price') return a.price - b.price;
        return 0;
      });
  }, [products, search, sortBy]); // ← only recompute when these change

  return (
    <div className={theme}>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="name">Name</option>
        <option value="price">Price</option>
      </select>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </button>

      <ul>
        {visibleProducts.map(p => <li key={p.id}>{p.name} - ${p.price}</li>)}
      </ul>
    </div>
  );
}
```

### Explanation
- The filter+sort runs over potentially **thousands of items** — expensive.
- Without `useMemo`: clicking the **theme toggle** would re-run the entire filter+sort, even though `products`, `search`, and `sortBy` didn't change. Wasted work.
- With `useMemo`: changing the theme only re-renders the wrapper `<div>`. The cached `visibleProducts` array is reused. The `console.log` only fires when search, sort, or products actually change.

### When to use `useMemo`
✅ The calculation is **measurably slow** (e.g., sorting/filtering large arrays, complex math)  
✅ You need a **stable object/array reference** to pass to a memoized child or to a hook's dependency array  

❌ Don't wrap cheap calculations — `useMemo` itself has overhead  
❌ Not for side effects — use `useEffect`

### Common pitfall
```jsx
// ❌ Useless — adding two numbers is faster than memoizing
const sum = useMemo(() => a + b, [a, b]);

// ✅ Worth it — sorting 10,000 items is expensive
const sorted = useMemo(() => bigArray.sort(...), [bigArray]);
```

---

## 3. `useCallback` — Memoize a Function

### What it does
Returns the **same function reference** between renders, as long as its dependencies don't change.

It's basically `useMemo` for functions:
```jsx
useCallback(fn, deps) === useMemo(() => fn, deps)
```

### Syntax
```jsx
const memoizedFn = useCallback(() => doSomething(a, b), [a, b]);
```

### Real-world example: A todo app where deletion shouldn't re-render every item

```jsx name=todo-app.jsx
import { useState, useCallback, memo } from 'react';

const TodoItem = memo(function TodoItem({ todo, onDelete }) {
  console.log('Rendering todo:', todo.text);
  return (
    <li>
      {todo.text}
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
});

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Build app' },
    { id: 3, text: 'Ship it' },
  ]);
  const [input, setInput] = useState('');

  // ❌ Without useCallback, this is a NEW function reference every render
  // const handleDelete = (id) => setTodos(t => t.filter(x => x.id !== id));

  // ✅ With useCallback, the same function reference is reused
  const handleDelete = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []); // No deps because we use the functional updater

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <ul>
        {todos.map(t => (
          <TodoItem key={t.id} todo={t} onDelete={handleDelete} />
        ))}
      </ul>
    </div>
  );
}
```

### Explanation
- Every time the user types in `<input>`, `TodoApp` re-renders.
- **Without `useCallback`**: `handleDelete` would be a brand-new function each render → its reference would change → `TodoItem`'s `memo` check would fail → **every TodoItem re-renders on every keystroke**.
- **With `useCallback`**: `handleDelete` keeps the same reference → `TodoItem`'s `memo` check passes → todos don't re-render when typing.

You'll see the `console.log` only when todos actually change, not on every keystroke.

### When to use `useCallback`
✅ Passing callbacks to **memoized children** (`React.memo` components)  
✅ Passing functions as **dependencies** to other hooks (`useEffect`, `useMemo`)  
✅ Functions used by custom hooks that depend on stability  

❌ Don't use it on every function — if the child isn't memoized, it does nothing useful  
❌ Without `React.memo` on the child, `useCallback` is wasted

---

## 4. How They Work Together — Real-World Example: Shopping Cart

This example combines all three:

```jsx name=shopping-cart.jsx
import { useState, useMemo, useCallback, memo } from 'react';

// Memoized child - only re-renders when its props change
const CartItem = memo(function CartItem({ item, onRemove, onQuantityChange }) {
  console.log('Rendering CartItem:', item.name);
  return (
    <div className="cart-item">
      <span>{item.name}</span>
      <input
        type="number"
        value={item.quantity}
        onChange={e => onQuantityChange(item.id, +e.target.value)}
      />
      <span>${(item.price * item.quantity).toFixed(2)}</span>
      <button onClick={() => onRemove(item.id)}>Remove</button>
    </div>
  );
});

function ShoppingCart() {
  const [items, setItems] = useState([
    { id: 1, name: 'Book',   price: 15, quantity: 1 },
    { id: 2, name: 'Pen',    price: 2,  quantity: 3 },
    { id: 3, name: 'Laptop', price: 999, quantity: 1 },
  ]);
  const [coupon, setCoupon] = useState('');

  // 1️⃣ useMemo — expensive total calculation, only runs when items change
  const { subtotal, tax, total } = useMemo(() => {
    console.log('Recalculating totals...');
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.08;
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  // 2️⃣ useCallback — stable function references for memoized children
  const handleRemove = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleQuantityChange = useCallback((id, qty) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  return (
    <div>
      <h2>Cart</h2>
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onRemove={handleRemove}
          onQuantityChange={handleQuantityChange}
        />
      ))}

      <input
        value={coupon}
        onChange={e => setCoupon(e.target.value)}
        placeholder="Coupon code"
      />

      <div className="totals">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax: ${tax.toFixed(2)}</p>
        <p>Total: ${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

### Walkthrough — what happens when user types in coupon

1. `coupon` state changes → `ShoppingCart` re-renders.
2. **`useMemo`**: `items` didn't change → totals are reused from cache. `console.log` does NOT fire. ✅
3. **`useCallback`**: `handleRemove` and `handleQuantityChange` keep the same references. ✅
4. **`React.memo`**: Each `CartItem` checks its props (`item`, `onRemove`, `onQuantityChange`). All unchanged → skips re-render. `console.log` does NOT fire. ✅

**Result**: Only the coupon input and the totals area update. Cart items stay perfectly still.

### Walkthrough — what happens when user changes quantity

1. `items` changes → re-render.
2. **`useMemo`**: `items` changed → totals recalculate. ✅
3. **`useCallback`**: References still stable.
4. **`React.memo`**: The single changed `CartItem` re-renders (new `item` object). The other items skip. ✅

---

## 5. Quick Comparison Table

| | `React.memo` | `useMemo` | `useCallback` |
|---|---|---|---|
| **Memoizes** | Component | Value | Function |
| **Type** | HOC (wraps component) | Hook | Hook |
| **Returns** | Memoized component | Cached value | Cached function |
| **Re-runs when** | Props change | Deps change | Deps change |
| **Common use** | Skip child renders | Skip expensive calcs | Stable callback for memoized children |

---

## 6. The Golden Rule

> **Don't optimize prematurely.**

These tools are not free. They:
- Add code complexity
- Use memory (caching has cost)
- Run dependency comparisons every render

### Use them when you have a *real* performance problem:
1. **Measure first** with React DevTools Profiler.
2. Identify components that re-render often or take long.
3. Apply the right tool:
   - Slow calculation? → `useMemo`
   - Child re-rendering unnecessarily? → `React.memo` + `useCallback` for the function props

### Don't reach for them when:
- The component is small and renders fast
- You're not passing functions/objects to memoized children
- You haven't measured a problem

---

## TL;DR

| Tool | "When my X is the same as last time, don't redo Y" |
|---|---|
| **`React.memo`** | Props are the same → don't re-render the component |
| **`useMemo`** | Dependencies are the same → don't recompute the value |
| **`useCallback`** | Dependencies are the same → don't recreate the function |

They're often used together: `useCallback` and `useMemo` produce stable references, which let `React.memo` actually skip re-renders. Apart, each is much less effective.