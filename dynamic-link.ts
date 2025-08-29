import { Plugin } from "vite";

const BASE_PATH = `function basePath() {
	const pathname = window.location.pathname;
	const explorerIndex = pathname.lastIndexOf("/explorer");

	if (explorerIndex !== -1) {
		return pathname.substring(0, explorerIndex) + "/explorer";
	} else {
		console.error("Couldn't determine the base path. App is in embedded mode but '/explorer' was not found in the pathname");
		return "";
	}
}`;

function createFaviconAssetTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// Favicon
	const ${var_name} = document.createElement("link");
	${var_name}.rel = "icon";
	${var_name}.type = "image/svg+xml";
	${var_name}.href = basePath() + "/${path}";
	document.head.appendChild(${var_name});
`;
}

function createCssAssetTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// CSS
	const ${var_name} = document.createElement("link");
	${var_name}.rel = "stylesheet";
	${var_name}.href = basePath() + "/${path}";
	${var_name}.setAttribute("crossorigin", "");
	document.head.appendChild(${var_name});
`;
}

function createModulePreloadTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// Module Preload
	const ${var_name} = document.createElement("link");
	${var_name}.rel = "modulepreload";
	${var_name}.href = basePath() + "/${path}";
	${var_name}.setAttribute("crossorigin", "");
	document.head.appendChild(${var_name});
`;
}

function createScriptTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// Script
	const ${var_name} = document.createElement("script");
	${var_name}.src = basePath() + "/${path}";
	document.head.appendChild(${var_name});
`;
}

function createJsAssetTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// JS
	const ${var_name} = document.createElement("script");
	${var_name}.type = "module";
	${var_name}.src = basePath() + "/${path}";
	${var_name}.setAttribute("crossorigin", "");
	document.head.appendChild(${var_name});
`;
}

function createBackgroundAssetTemplate(path: string): string {
  const var_name = `___${Math.random().toString(36).substr(2, 9)}`;
  return `
	// Background
	const ${var_name} = document.createElement("style");
	${var_name}.textContent = "body { background-image: url('" + basePath() + "/${path}'); }";
	document.head.appendChild(${var_name});
`;
}

function dynamicAssetsLoadingTemplate(
  favicons?: string[],
  cssFiles?: string[],
  jsFiles?: string[],
  background?: string,
  modulePreloads?: string[],
  scripts?: string[],
) {
  if (
    (!favicons || favicons.length === 0) &&
    (!cssFiles || cssFiles.length === 0) &&
    (!jsFiles || jsFiles.length === 0) &&
    !background &&
    (!modulePreloads || modulePreloads.length === 0) &&
    (!scripts || scripts.length === 0)
  ) {
    return;
  }

  const faviconTemplates = favicons?.join("\n") || "";
  const cssTemplates = cssFiles?.join("\n") || "";
  const jsTemplates = jsFiles?.join("\n") || "";
  const modulePreloadTemplates = modulePreloads?.join("\n") || "";
  const scriptTemplates = scripts?.join("\n") || "";

  return `
<script>
	${BASE_PATH}
	document.addEventListener("DOMContentLoaded", function () {
		${modulePreloadTemplates}
		${scriptTemplates}
		${faviconTemplates}
		${cssTemplates}
		${jsTemplates}
		${background || ""}
	});
</script>
`;
}

export default function dynamicLinksPlugin(): Plugin {
  return {
    name: "vite-plugin-dynamic-links",
    transformIndexHtml(html: string): string {
      const faviconRegex =
        /<link rel="icon" (?:type="[^"]+")? href="([^"]+)" \/>/g;
      const cssRegex = /<link rel="stylesheet" crossorigin href="([^"]+)">/g;
      const jsRegex =
        /<script type="module" crossorigin src="([^"]+)"><\/script>/g;
      const modulePreloadRegex =
        /<link rel="modulepreload" crossorigin href="([^"]+)">/g;
      const scriptRegex = /<script src="([^"]+)"><\/script>/g;

      // Find all favicon matches
      const faviconMatches = [];
      let faviconMatch;
      while ((faviconMatch = faviconRegex.exec(html)) !== null) {
        faviconMatches.push(faviconMatch);
      }

      // Find all CSS matches
      const cssMatches = [];
      let cssMatch;
      while ((cssMatch = cssRegex.exec(html)) !== null) {
        cssMatches.push(cssMatch);
      }

      // Find all JS matches
      const jsMatches = [];
      let jsMatch;
      while ((jsMatch = jsRegex.exec(html)) !== null) {
        jsMatches.push(jsMatch);
      }

      // Find all module preload matches
      const modulePreloadMatches = [];
      let moduleMatch;
      while ((moduleMatch = modulePreloadRegex.exec(html)) !== null) {
        modulePreloadMatches.push(moduleMatch);
      }

      // Find all script matches
      const scriptMatches = [];
      let scriptMatch;
      while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        scriptMatches.push(scriptMatch);
      }

      // Process favicons
      const faviconTemplates = [];
      for (const match of faviconMatches) {
        const faviconPath = match[1].replace(/^\//, "");
        faviconTemplates.push(createFaviconAssetTemplate(faviconPath));
      }
      // Remove favicon links from HTML
      html = html.replace(
        /<link rel="icon" (?:type="[^"]+")? href="[^"]+" \/>/g,
        "",
      );

      // Process CSS files
      const cssTemplates = [];
      for (const match of cssMatches) {
        const cssPath = match[1].replace(/^\//, "");
        cssTemplates.push(createCssAssetTemplate(cssPath));
      }
      // Remove CSS links from HTML
      html = html.replace(
        /<link rel="stylesheet" crossorigin href="[^"]+">/g,
        "",
      );

      // Process JS files
      const jsTemplates = [];
      for (const match of jsMatches) {
        const jsPath = match[1].replace(/^\//, "");
        jsTemplates.push(createJsAssetTemplate(jsPath));
      }
      // Remove JS script tags from HTML
      html = html.replace(
        /<script type="module" crossorigin src="[^"]+"><\/script>/g,
        "",
      );

      // Process module preloads
      const modulePreloadTemplates = [];
      for (const match of modulePreloadMatches) {
        const modulePath = match[1].replace(/^\//, "");
        modulePreloadTemplates.push(createModulePreloadTemplate(modulePath));
      }
      // Remove module preload links from HTML
      html = html.replace(
        /<link rel="modulepreload" crossorigin href="[^"]+">/g,
        "",
      );

      // Process scripts
      const scriptTemplates = [];
      for (const match of scriptMatches) {
        const scriptPath = match[1].replace(/^\//, "");
        scriptTemplates.push(createScriptTemplate(scriptPath));
      }
      // Remove script tags from HTML
      html = html.replace(/<script src="[^"]+"><\/script>/g, "");

      const backgroundTemplate = createBackgroundAssetTemplate("dotgrid.svg");

      const fullTemplate = dynamicAssetsLoadingTemplate(
        faviconTemplates,
        cssTemplates,
        jsTemplates,
        backgroundTemplate,
        modulePreloadTemplates,
        scriptTemplates,
      );

      if (fullTemplate) {
        // Insert the dynamic loading template after the <head> tag
        html = html.replace(/<head>/, `<head>${fullTemplate}`);
      }

      return html;
    },
  };
}
