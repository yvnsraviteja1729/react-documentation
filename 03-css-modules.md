## What are CSS Modules?

Standard CSS has a "global scope" problem. If you define `.button` in `styles.css` and another `.button` in `header.css`, they will overwrite each other.

**CSS Modules** solve this by locally scoping your styles. When you use a CSS Module, the build tool (like Vite or Webpack) takes your class name and appends a unique hash to it.

* **Your Code:** `.button { color: red; }`
* **The Browser's Code:** `.button_x7y2z { color: red; }`

This ensures that styles from one component never "leak" into another.

---

## Styling Approaches in Production

In professional codebases, developers rarely use plain, global CSS. Here are the three most common approaches used today:

### 1. CSS-in-JS (e.g., Styled Components, Emotion)

You write CSS directly inside your JavaScript files using template literals.

* **Pros:** Dynamic styling based on props (e.g., `<Button primary/>`), no extra CSS files.
* **Cons:** Performance overhead (runtime injection) and larger JS bundle sizes.

### 2. Utility-First CSS (e.g., Tailwind CSS)

You apply pre-defined classes directly in your HTML/JSX (e.g., `className="p-4 bg-blue-500 rounded"`).

* **Pros:** Extremely fast development, no naming things, tiny final CSS file.
* **Cons:** Can make the JSX look "messy" or cluttered.

### 3. CSS Modules (The "Middle Ground")

You write traditional CSS but import it as an object.

* **Pros:** Zero runtime overhead, clean separation of concerns, and guaranteed local scoping.
* **Cons:** You still have to manage separate `.css` files.

---

## What is the "Best" Way?

There is no single "best" way, but the industry is currently trending heavily toward **Tailwind CSS** for speed and **CSS Modules** for design systems where traditional CSS control is needed.

* **Choose Tailwind** if you want to move fast and maintain a consistent look without writing custom CSS logic.
* **Choose CSS Modules** if you prefer a clean separation between your logic (JS) and your design (CSS).

---

## Interview Questions on Styling

If you are preparing for a React or Frontend interview, be ready for these:

1. **What is the difference between Global CSS and CSS Modules?**
* *Answer:* Global CSS can cause naming collisions across the app; CSS Modules use hashing to scope styles locally to a component.


2. **How do CSS Modules handle class composition?**
* *Answer:* You can use the `composes` keyword to inherit styles from another class within the same module or a different file.


3. **What are the performance trade-offs of Styled Components vs. CSS Modules?**
* *Answer:* Styled Components generate styles at runtime (JavaScript execution), whereas CSS Modules are extracted into static `.css` files at build time, which is generally faster for the browser to parse.


4. **How do you apply multiple classes in a CSS Module?**
* *Answer:* Since classes are accessed as object properties, you use template literals: `className={`${styles.btn} ${styles.primary}`}` or a library like `classnames`.


5. **What does the `:global` selector do in a CSS Module?**
* *Answer:* It allows you to opt-out of local scoping for a specific rule, making that class accessible globally (useful for styling 3rd party library components).



Which of these approaches have you used in your projects so far—are you more of a "write your own CSS" person or a "utility class" fan?