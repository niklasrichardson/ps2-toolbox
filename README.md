# PS/2 Toolbox

Two offline-capable IBM hardware lookups from public references.

- [Toolbox home](https://niklasrichardson.github.io/ps2-toolbox/) introduces both tools.
- [MCA ADF Lookup](https://niklasrichardson.github.io/ps2-toolbox/mca-lookup/) searches adapter descriptions, variants, planar IDs and companion files.
- [Memory Lookup](https://niklasrichardson.github.io/ps2-toolbox/memory-lookup/) joins the IBM EPRM machine and part-number tables with OEM markings and model-specific memory references.
- [About](https://niklasrichardson.github.io/ps2-toolbox/about/) lists each lookup's scope and sources.

Keep this directory tree together and open `index.html` to browse offline. Each lookup directory has its own data file. Both tools share the Carbon stylesheet and IBM Plex Sans font in `assets`.

For each user-facing update, bump `site/VERSION` in the PS/2 Toolbox workspace before regenerating the site with `python -m toolbox.toolbox_site`. Copy the contents of `site/dist` and the updated version file to this repository in the same change. Use a patch bump for fixes, a minor bump for backwards-compatible features and a major bump for breaking changes. For an approved release, annotate the published commit with the matching `vX.Y.Z` tag.
