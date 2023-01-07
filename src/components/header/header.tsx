import { component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./header.css?inline";

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <header>
      <h1>Mintter Experiment #1</h1>
      <ul>
        {/* <li>
          <a href="/">Line Editors</a>
        </li>
        <li>
          <a href="/page/">Page Demo</a>
        </li> */}
      </ul>
    </header>
  );
});
