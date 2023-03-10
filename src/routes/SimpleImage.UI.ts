import xss from "xss";
import { SimpleImage } from "./SimpleImage.ItemSchema";

export const SimpleImageHTML = SimpleImage.forHTML(({ values }) => {
  const css = [
    `.mintty-image {
  display: flex;
  flex-direction: column;
  justify: center;
  gap: 4px;
}
.mintty-image--image {
  background: whitesmoke;
  border-radius: 6px;
  max-height: 100px;
  max-width: 100px;
  object-fit: contain;
}
.mintty-image--caption {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}`,
  ].join("");

  let src = values.imageSrc["data-uri"] ?? "";
  // if (!html) html = "<img>";
  // else html = xss(html);
  // // Add wrapping paragraph
  // const noParagraphs = !/\s*<p\b/.test(html);
  // if (noParagraphs) html = `<p>${html}</p>`;
  return {
    html: `<div class="mintty-image">
  <img class="mintty-image--image" src="${src.replace(/"/g, "🚭")}"/>
  <div class="mintty-image--caption">
    ${xss(values.title["text/html"] ?? "")}
  </div>
</div>`,
    css,
  };
});

export const SimpleImageWeb = SimpleImage.forWeb((mountTo) => {
  const caption = document.createElement("div");
  caption.classList.add("mintty-image--caption");
  caption.innerHTML = xss(mountTo.values.title["text/html"]);
  const img = document.createElement("img");
  img.classList.add("mintty-image--image");
  img.src = mountTo.values.imageSrc["data-uri"] ?? "";
  const frag = document.createElement("div");
  frag.classList.add("mintty-image");
  frag.append(img, caption);
  frag.tabIndex = 1; // make it "targetable"

  return {
    // override current value from save
    apply(values) {
      if (values.imageSrc) {
        img.src = values.imageSrc["data-uri"];
      }
      // updateFn(values);
    },
    mount({ container }) {
      container.appendChild(frag);
      return {
        destroy() {
          // Hmm?
          frag.remove();
          // view.destroy();
        },
      };
    },
  };
});
