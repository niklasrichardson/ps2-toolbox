"use strict";

(() => {
  const { documents, parts } = window.ps2LookupData ?? {};
  const get = (id) => document.getElementById(id);
  const status = get("status");
  const query = get("query");
  const family = get("family");
  const source = get("source");
  const results = get("results");
  const pagination = get("pagination");
  const previous = get("previous");
  const next = get("next");
  if (!parts?.length || !documents?.length) {
    status.textContent = "The FRU catalogue could not be loaded.";
    return;
  }

  const pageSize = 30;
  const evidenceSize = 25;
  const numberFormat = new Intl.NumberFormat("en-GB");
  const methodRank = {
    "manual parts list": 0, "FRU column": 1, "FRU index": 2, "manual FRU field": 3,
    "service parts column": 4, "FRU text column": 5, "FRU label": 6,
  };
  const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const families = new Set();
  const catalogue = parts.map(([number, records]) => ({
    number,
    key: normalise(number),
    records: records.map(([documentId, label, familyLabel, machine, related, locator, method]) => {
      const [collection, title, url] = documents[documentId];
      const familyNames = familyLabel ? familyLabel.split(", ") : [];
      familyNames.forEach((name) => families.add(name));
      const keys = related.map(([, identifier]) => normalise(identifier));
      return {
        label, machine, related, locator, method, collection, title, url,
        familyNames, keys,
        text: normalise([number, label, familyLabel, machine, title, ...keys].join(" ")),
      };
    }).sort((a, b) => Number(!a.label) - Number(!b.label) || methodRank[a.method] - methodRank[b.method]),
  }));

  for (const name of [...families].sort()) family.add(new Option(name, name));
  for (const name of [...new Set(documents.map(([collection]) => collection))].sort()) {
    source.add(new Option(name, name));
  }

  let matches = [];
  let page = 0;
  let timer;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function evidenceRow(record) {
    const item = element("li");
    const group = element("span", record.collection + " · ", "evidence-context");
    const link = element("a", record.title || "Open source", "cds--link");
    link.href = record.url;
    item.append(group, link);
    if (record.label) item.append(element("p", record.label));
    const context = [record.familyNames.join(", "), record.machine, record.locator, record.method].filter(Boolean);
    item.append(element("p", context.join(" · "), "evidence-context"));
    if (record.related.length) {
      const related = record.related.map(([kind, number]) => kind + " " + number).join(" · ");
      item.append(element("p", related));
    }
    return item;
  }

  function partResult({ number, records, exact }, open) {
    const details = element("details", "", "part");
    const summary = element("summary");
    const first = records.find((record) => record.label) ?? records[0];
    summary.append(
      element("span", number, "part-number"),
      element("span", first.label || first.title || first.collection, "part-label"),
      element("span", numberFormat.format(records.length) + (records.length === 1 ? " source record" : " source records"), "part-count"),
    );
    if (exact === 1) summary.append(element("span", "Related number match", "part-count"));
    details.append(summary);

    function showEvidence() {
      const list = element("ul", "", "evidence-list");
      const more = element("button", "", "cds--btn cds--btn--ghost more");
      more.type = "button";
      let shown = 0;
      function showMore() {
        const batch = records.slice(shown, shown + evidenceSize);
        list.append(...batch.map(evidenceRow));
        shown += batch.length;
        more.hidden = shown === records.length;
        more.textContent = "Show more source records (" + numberFormat.format(records.length - shown) + " left)";
        if (more.hidden && document.activeElement === more) list.children[shown - batch.length].querySelector("a").focus();
      }
      more.addEventListener("click", showMore);
      details.append(list, more);
      showMore();
    }
    if (open) {
      showEvidence();
      details.open = true;
    } else {
      details.addEventListener("toggle", () => {
        if (details.open && details.children.length === 1) showEvidence();
      });
    }
    return details;
  }

  function render() {
    const total = matches.length;
    const pages = Math.ceil(total / pageSize);
    const start = page * pageSize;
    results.replaceChildren(...matches.slice(start, start + pageSize)
      .map((part) => partResult(part, total === 1)));
    pagination.hidden = pages <= 1;
    previous.disabled = page === 0;
    next.disabled = page + 1 >= pages;
    get("page-label").textContent = "Page " + (page + 1) + " of " + pages;
    if (total) {
      status.textContent = numberFormat.format(total) + (total === 1 ? " matching FRU" : " matching FRUs") +
        (pages > 1 ? " · " + numberFormat.format(start + 1) + "–" + numberFormat.format(Math.min(start + pageSize, total)) : "");
    }
  }

  function search() {
    clearTimeout(timer);
    page = 0;
    const text = normalise(query.value);
    const words = text ? text.split(" ") : [];
    const identifier = text.replaceAll(" ", "");
    const chosenFamily = family.value;
    const chosenSource = source.value;
    matches = [];
    if (!words.length && !chosenFamily && !chosenSource) {
      render();
      status.textContent = "Search " + numberFormat.format(catalogue.length) + " FRU numbers or choose a filter.";
      return;
    }

    for (const part of catalogue) {
      const exactFRU = !!identifier && part.key === identifier;
      const exactRelated = [];
      const other = [];
      for (const record of part.records) {
        if (chosenFamily && !record.familyNames.includes(chosenFamily)) continue;
        if (chosenSource && record.collection !== chosenSource) continue;
        if (identifier && record.keys.includes(identifier)) exactRelated.push(record);
        else if (exactFRU || words.every((word) => record.text.includes(word))) other.push(record);
      }
      if (exactRelated.length || other.length) {
        matches.push({
          number: part.number,
          records: exactRelated.concat(other),
          exact: exactFRU ? 2 : Number(exactRelated.length > 0),
        });
      }
    }
    matches.sort((a, b) => b.exact - a.exact);
    render();
    if (!matches.length) status.textContent = "No matching FRUs. Try a different search or clear the filters.";
  }

  query.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(search, 120);
  });
  family.addEventListener("change", search);
  source.addEventListener("change", search);
  for (const button of document.querySelectorAll("[data-query]")) {
    button.addEventListener("click", () => {
      query.value = button.dataset.query;
      query.focus();
      search();
    });
  }
  get("clear").addEventListener("click", () => {
    query.value = family.value = source.value = "";
    query.focus();
    search();
  });
  function changePage(offset) {
    page += offset;
    render();
    if (document.activeElement?.disabled) (offset < 0 ? next : previous).focus();
  }
  previous.addEventListener("click", () => changePage(-1));
  next.addEventListener("click", () => changePage(1));
  search();
})();
