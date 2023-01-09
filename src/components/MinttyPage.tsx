import { component$, useClientEffect$, useStyles$ } from "@builder.io/qwik";
import { ProseMirrorBlockContainerHTML } from "../routes/ProseMirrorBlockContainer.UI";
import {
  renderContainerForHTML,
  createUIStateForWeb,
} from "../routes/defineItemSchema";
import { pickUIFn } from "./pickUIFn";
import { PAGE_TEST_DATA } from "./PAGE_TEST_DATA.const";

/**
 * This is the mount root for the mintty page demo
 * Interesting:
 *  * See the data structure for Mintty test page
 *
 * Not interesting (not thought much about):
 *  * How we interface with Qwik to do both HTML & CSS rendering / mounting
 */
export const MinttyPage = component$(() => {
  const pageHTMLID = "c-" + Math.random().toString(36).slice(2);

  const htmlForBlockContainer = renderContainerForHTML({
    data: PAGE_TEST_DATA,
    pickUI: pickUIFn,
  });

  // console.log(dev`${htmlForBlockContainer}`._display);
  const pageHTML = ProseMirrorBlockContainerHTML.html(htmlForBlockContainer);

  useClientEffect$(() => {
    const web = createUIStateForWeb({
      data: PAGE_TEST_DATA,
      pickUI: pickUIFn,
      TODO_Save: null,
      // mountTo: {
      //   container: document.getElementById(pageHTMLID) as HTMLElement,
      //   async save(values) {
      //     console.warn(
      //       dev`TODO: save prosemirror container values: ${values}`._display
      //     );
      //   },
      // },
    });

    console.log("page web", web);

    const mounted = web.mount({
      // TODO: Remove children from HTML render (do after so we can dev debug)
      container: document.getElementById(pageHTMLID) as HTMLElement,
    });
    console.log("page mounted", mounted);
  });

  useStyles$(`
.page-container {
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0px 20px 40px rgba(20,30,140,0.2);
}
  `);

  return (
    <div>
      <p>Page container renders embedded editors with HTML</p>
      <hr />
      <style>{pageHTML.css}</style>
      <div
        class="page-container"
        dangerouslySetInnerHTML={pageHTML.html}
        id={pageHTMLID}
      ></div>
    </div>
  );
});
