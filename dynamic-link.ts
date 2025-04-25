import { PluginOption } from "vite";

const DYNAMIC_ASSETS_LOADING_TEMPLATE = `
<script>
		document.addEventListener("DOMContentLoaded", function () {
				const currentPath = window.location.pathname;
				const basePath = currentPath.substring(
						0,
						currentPath.lastIndexOf("/") + 1
				);

				// Favicon
				const iconLink = document.createElement("link");
				iconLink.rel = "icon";
				iconLink.type = "image/svg+xml";
				iconLink.href = basePath + "/cartridge.svg";
				document.head.appendChild(iconLink);

				// CSS
				const cssLink = document.createElement("link");
				cssLink.rel = "stylesheet";
				cssLink.href = basePath + "<PATH_TO_CSS_ASSET>";
				cssLink.setAttribute("crossorigin", "");
				document.head.appendChild(cssLink);

				// JS
				const script = document.createElement("script");
				script.type = "module";
				script.src = basePath + "<PATH_TO_JS_ASSET>";
				script.setAttribute("crossorigin", "");
				document.head.appendChild(script);
		});
</script>
`;

export default function dynamicLinksPlugin(): PluginOption[] {
  return [
    {
      name: "vite-plugin-dynamic-links",
      transformIndexHtml(html: string): string {
        // Find the CSS path
        const cssMatch = html.match(
          /<link rel="stylesheet" crossorigin href="([^"]+)">/
        );
        const jsMatch = html.match(
          /<script type="module" crossorigin src="([^"]+)"><\/script>/
        );

        if (cssMatch && jsMatch) {
          // Extract the asset paths
          const cssPath = cssMatch[1].replace(/^\//, ""); // Remove leading slash if present
          const jsPath = jsMatch[1].replace(/^\//, "");

          // Create the dynamic loading template with actual asset paths
          let updatedHtml = DYNAMIC_ASSETS_LOADING_TEMPLATE.replace(
            "<PATH_TO_CSS_ASSET>",
            cssPath
          ).replace("<PATH_TO_JS_ASSET>", jsPath);

          // Remove the static link and script tags (they're now loaded dynamically)
          updatedHtml = updatedHtml.replace(/\/cartridge.svg/g, "");
          updatedHtml = html.replace(
            /<script type="module" crossorigin src="[^"]+"><\/script>/g,
            ""
          );
          updatedHtml = updatedHtml.replace(
            /<link rel="stylesheet" crossorigin href="[^"]+">/g,
            ""
          );

          // Insert the dynamic loading template after the <head> tag
          updatedHtml = updatedHtml.replace(/<head>/, `<head>${updatedHtml}`);

          return updatedHtml;
        }

        return html;
      },
    },
  ];
}
