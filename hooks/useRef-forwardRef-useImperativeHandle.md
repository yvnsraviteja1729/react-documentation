# `useRef`, `forwardRef`, and `useImperativeHandle` in React

These three APIs work together to give you **escape hatches** from React's declarative model — letting you directly interact with DOM nodes or expose imperative methods from child components.

```jsx
import { useRef, forwardRef, useImperativeHandle } from 'react';
```

---

## 1. `useRef` — A Persistent, Mutable Container

### What it is
`useRef` is a Hook that returns a mutable object: `{ current: <value> }`. The same object is preserved across re-renders, and **mutating `.current` does NOT trigger a re-render**.

```jsx name=syntax.jsx
const ref = useRef(initialValue);
// ref.current === initialValue
```

### Key properties
| Feature | Behavior |
|---|---|
| Mutable | You can reassign `.current` freely |
| Persistent | Same object across renders |
| No re-render | Changing `.current` does not re-render |
| Synchronous | Updates apply immediately |

### Use case A — Accessing a DOM element

```jsx name=focus-input.jsx
import { useRef, useEffect } from 'react';

function AutoFocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus(); // direct DOM API
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

When React mounts the `<input>`, it sets `inputRef.current` to the DOM node. On unmount, it resets to `null`.

### Use case B — Storing mutable values (timers, instance vars)

```jsx name=timer.jsx
import { useRef, useState, useEffect } from 'react';

function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setCount(c => c + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return <h1>{count}s</h1>;
}
```

### Use case C — Tracking the previous value

```jsx name=use-previous.jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
```

### `useRef` vs `useState`
| | `useState` | `useRef` |
|---|---|---|
| Triggers re-render? | ✅ Yes | ❌ No |
| Persisted across renders | ✅ | ✅ |
| Use for UI data | ✅ | ❌ |
| Use for behind-the-scenes data | ❌ | ✅ |

---

## 2. `forwardRef` — Pass a Ref Through a Component

### The problem
By default, function components **cannot receive `ref` as a prop**:

```jsx
function MyInput(props) {
  return <input {...props} />;
}

const ref = useRef(null);
<MyInput ref={ref} />; // ❌ Warning: Function components cannot be given refs
```

React doesn't know which internal element the ref should attach to.

### The solution
`forwardRef` wraps a component so it receives **`ref` as a second argument**, which you can then attach to a child element.

```jsx name=fancy-input.jsx
import { forwardRef, useRef } from 'react';

const FancyInput = forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} className="fancy" {...props} />;
});

function Parent() {
  const inputRef = useRef(null);

  return (
    <>
      <FancyInput ref={inputRef} placeholder="Type..." />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

Now the parent's `inputRef.current` directly points to the underlying `<input>` DOM node.

### Common use cases
- Reusable UI library components (buttons, inputs, modals)
- Integrating with third-party DOM-based libraries (GSAP, focus traps)
- Measuring elements (`getBoundingClientRect`, `IntersectionObserver`) from a parent

### React 19 note
In React 19, `forwardRef` is **no longer required** — `ref` can be passed as a regular prop:

```jsx name=react19.jsx
// React 19+
function FancyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

For React ≤ 18, you must use `forwardRef`.

---

## 3. `useImperativeHandle` — Customize What a Ref Exposes

### The problem
When you forward a ref, the parent gets the **raw DOM node** — meaning it can call ANY DOM method (`.remove()`, `.style.color = 'red'`, etc.). This breaks encapsulation.

### The solution
`useImperativeHandle` lets you customize **exactly what the parent's ref sees** — typically a small, controlled API.

### Syntax
```jsx
useImperativeHandle(ref, () => ({ /* methods you expose */ }), [deps]);
```

| Argument | Description |
|---|---|
| `ref` | The forwarded ref from `forwardRef` |
| Factory fn | Returns the object the parent's `ref.current` will point to |
| `[deps]` | Optional dependency array — re-creates the handle when deps change |

### Example — Exposing only `focus` and `clear`

```jsx name=custom-input.jsx
import { forwardRef, useRef, useImperativeHandle } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }));

  return <input ref={inputRef} {...props} />;
});

function Parent() {
  const ref = useRef(null);
  return (
    <>
      <CustomInput ref={ref} />
      <button onClick={() => ref.current.focus()}>Focus</button>
      <button onClick={() => ref.current.clear()}>Clear</button>
    </>
  );
}
```

The parent only sees `{ focus, clear }` — not the underlying DOM node.

### Example — A modal with `open`/`close`

```jsx name=modal.jsx
import { forwardRef, useState, useImperativeHandle } from 'react';

const Modal = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(o => !o),
  }));

  if (!open) return null;
  return (
    <div className="modal">
      <p>{props.children}</p>
      <button onClick={() => setOpen(false)}>Close</button>
    </div>
  );
});

function App() {
  const modalRef = useRef(null);
  return (
    <>
      <button onClick={() => modalRef.current.open()}>Open Modal</button>
      <Modal ref={modalRef}>Hello!</Modal>
    </>
  );
}
```

### When to use it
- Build a **controlled imperative API** for a component (e.g., `play()`, `pause()` on a custom video player)
- **Hide implementation details** — the parent shouldn't manipulate internal DOM directly
- **Combine multiple internal refs** behind one API

### When NOT to use it
- If you can solve it with props/state, do that instead.
- Don't reach for it just because you can — it's an escape hatch.

---

## 4. How They Work Together

These three APIs form a layered pattern:

| Layer | API | Purpose |
|---|---|---|
| 1 | `useRef` | Create the ref container |
| 2 | `forwardRef` | Allow a child to receive that ref |
| 3 | `useImperativeHandle` | Define what the ref exposes |

### Complete example — A reusable form field

```jsx name=complete-example.jsx
import { useRef, forwardRef, useImperativeHandle, useState } from 'react';

// Child: exposes a controlled imperative API
const TextField = forwardRef(({ label, ...props }, ref) => {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    getValue: () => inputRef.current.value,
    validate: () => {
      const valid = inputRef.current.value.trim() !== '';
      setError(valid ? '' : 'Required');
      return valid;
    },
    reset: () => {
      inputRef.current.value = '';
      setError('');
    },
  }));

  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      {label}
      <input ref={inputRef} {...props} />
      {error && <span style={{ color: 'red' }}> {error}</span>}
    </label>
  );
});

// Parent: orchestrates child fields imperatively
export default function Form() {
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = [nameRef, emailRef].every(r => r.current.validate());
    if (!valid) {
      nameRef.current.focus();
      return;
    }
    alert(`Name: ${nameRef.current.getValue()}, Email: ${emailRef.current.getValue()}`);
  };

  const handleReset = () => {
    nameRef.current.reset();
    emailRef.current.reset();
    nameRef.current.focus();
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField ref={nameRef} label="Name: " />
      <TextField ref={emailRef} label="Email: " type="email" />
      <button type="submit">Submit</button>
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  );
}
```

---

## 5. TL;DR

| API | One-line summary |
|---|---|
| **`useRef`** | Creates a mutable `{ current }` container that persists across renders without causing re-renders. |
| **`forwardRef`** | Lets a function component **receive** a ref from its parent and attach it to a child element. |
| **`useImperativeHandle`** | Customizes the value exposed via that forwarded ref — defining a clean imperative API instead of leaking the raw DOM node. |

### Rule of thumb
> Prefer **declarative props + state** for almost everything.  
> Reach for these APIs only when you genuinely need **direct DOM access** or an **imperative API** (focus, scroll, animations, media playback, modals).