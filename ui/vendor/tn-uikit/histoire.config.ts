import { defineConfig, defaultColors } from "histoire";
import { HstVue } from "@histoire/plugin-vue";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { importPlugin } from "@nicco.io/markdown-it-import";

export default defineConfig({
  plugins: [HstVue()],
  outDir: "dist",
  backgroundPresets: [
    {
      color: "var(--background-primary-a-enabled)",
      label: "--background-primary-a-enabled",
      contrastColor: "var(--content-primary-a-enabled)"
    },
    {
      color: "var(--background-primary-b-enabled)",
      label: "--background-primary-b-enabled",
      contrastColor: "var(--content-primary-b-enabled)"
    },
    {
      color: "var(--background-secondary-a-enabled)",
      label: "--background-secondary-a-enabled",
      contrastColor: "var(--content-secondary-enabled)"
    },
    {
      color: "var(--background-secondary-b-enabled)",
      label: "--background-secondary-b-enabled",
      contrastColor: "var(--content-secondary-enabled)"
    },
    {
      color: "var(--background-tertiary-enabled)",
      label: "--background-tertiary-enabled",
      contrastColor: "var(--content-tertiary-enabled)"
    },
    {
      color: "var(--background-accent-enabled)",
      label: "--background-accent-enabled",
      contrastColor: "var(--content-primary-b-enabled)"
    }
  ],
  tree: {
    order: (a: string, b: string) => {
      if (a === "Doc") return -1;
      return a.localeCompare(b);
    },
    groups: [
      {
        id: "top",
        title: ""
      },
      {
        id: "data",
        title: "Data"
      },
      {
        id: "form",
        title: "Form"
      },
      {
        id: "navigation",
        title: "Navigation"
      },
      {
        id: "other",
        title: "Other"
      }
    ]
  },
  markdown(md) {
    md.use(importPlugin, {
      root: __dirname
    });
    return md;
  },
  theme: {
    title: "TN Life UI Kit",
    hideColorSchemeSwitch: false,
    darkClass: "tn-dark-theme",
    defaultColorScheme: "light",
    favicon: "./.histoire/assets/images/logoSquare.svg",
    logo: {
      square: "./.histoire/assets/images/logoSquare.svg",
      light: "./.histoire/assets/images/logoLight.svg",
      dark: "./.histoire/assets/images/logoDark.svg"
    },
    colors: {
      primary: defaultColors.gray
    },
    logoHref: "/"
  },
  vite: {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./")
      }
    },
    publicDir: "./.histoire/assets"
  },
  setupFile: {
    browser: `histoire.setup.ts`
  }
});
