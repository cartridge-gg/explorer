import { Plugin } from "vite";

const BASE_PATH = '(window.BASE_PATH || "")';

function createFaviconAssetTemplate(path: string): string {
  return `
	// Favicon
	const iconLink = document.createElement("link");
	iconLink.rel = "icon";
	iconLink.type = "image/svg+xml";
	iconLink.href = ${BASE_PATH} + "${path}";
	document.head.appendChild(iconLink);
`;
}

function createCssAssetTemplate(path: string): string {
  return `
	// CSS
	const cssLink = document.createElement("link");
	cssLink.rel = "stylesheet";
	cssLink.href = ${BASE_PATH} + "${path}";
	cssLink.setAttribute("crossorigin", "");
	document.head.appendChild(cssLink);
`;
}

function createJsAssetTemplate(path: string): string {
  return `
	// JS
	const script = document.createElement("script");
	script.type = "module";
	script.src = ${BASE_PATH} + "${path}";
	script.setAttribute("crossorigin", "");
	document.head.appendChild(script);
`;
}

function dynamicAssetsLoadingTemplate(
  favicon?: string,
  css?: string,
  js?: string,
  background?: string,
) {
  if (!favicon && !css && !js && !background) {
    return;
  }

  return `
<script>
	document.addEventListener("DOMContentLoaded", function () {
		${favicon || ""}
		${css || ""}
		${js || ""}
	});
</script>
`;
}

export default function dynamicLinksPlugin(): Plugin {
  return {
    name: "vite-plugin-dynamic-links",
    transformIndexHtml(html: string): string {
      const faviconRegex =
        /<link rel="icon" (?:type="[^"]+")? href="([^"]+)" \/>/;
      const cssRegex = /<link rel="stylesheet" crossorigin href="([^"]+)">/;
      const jsRegex =
        /<script type="module" crossorigin src="([^"]+)"><\/script>/;

      const faviconMatch = html.match(faviconRegex);
      const cssMatch = html.match(cssRegex);
      const jsMatch = html.match(jsRegex);

      let faviconTemplate;
      if (faviconMatch) {
        const faviconPath = faviconMatch[1].replace(/^\//, "");
        faviconTemplate = createFaviconAssetTemplate(faviconPath);
        html = html.replace(faviconRegex, "");
      }

      let cssTemplate;
      if (cssMatch) {
        const cssPath = cssMatch[1].replace(/^\//, "");
        cssTemplate = createCssAssetTemplate(cssPath);
        html = html.replace(cssRegex, "");
      }

      let jsTemplate;
      if (jsMatch) {
        const jsPath = jsMatch[1].replace(/^\//, "");
        jsTemplate = createJsAssetTemplate(jsPath);
        html = html.replace(jsRegex, "");
      }

      const fullTemplate = dynamicAssetsLoadingTemplate(
        faviconTemplate,
        cssTemplate,
        jsTemplate,
      );

      if (fullTemplate) {
        // Insert the dynamic loading template after the <head> tag
        html = html.replace(/<head>/, `<head>${fullTemplate}`);
      }

      return html;
    },
  };
}
