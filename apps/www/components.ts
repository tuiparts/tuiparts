import { defineComponents } from "blume";
import GitHubStar from "./components/GitHubStar.astro";
import HeaderSearch from "./components/HeaderSearch.astro";

export default defineComponents({
  layout: {
    Search: HeaderSearch,
  },
  mdx: {
    GitHubStar,
  },
});
