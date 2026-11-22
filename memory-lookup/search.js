"use strict";

const {modules, machines, sources} = window.ps2LookupData;
const perPage = 24;
const filters = ["family", "machine", "size", "type"];
const machineName = ({label, variants}) => [label, variants.join(" / ")].filter(Boolean).join(" · ");
const machineSearch = machines.map(({label, variants, aliases}) => {
  const codes = label.match(/\b\d{4}\b/g) || [];
  const qualified = codes.flatMap((code) => variants.map((variant) => code + variant));
  return [label, ...variants, ...aliases, ...qualified].map(searchText);
});
const records = modules.map((row) => {
  const fields = [row.size, row.type, row.speed, row.maker, row.ref, row.pd, row.fit,
    ...(row.fru || []), ...(row.option || []), ...(row.marking || []), row.related];
  return {...row, searchable: fields.filter(Boolean).map((field) => searchText(String(field)))};
});
let page = 1;

function citation(key) {
  const [label, url] = sources[key];
  return sourceLink(label, url);
}

function fillOptions(id, label, entries) {
  const select = $(id);
  const selection = select.value;
  select.replaceChildren(new Option(label, ""), ...entries.map(([value, text]) => new Option(text, value)));
  if (entries.some(([value]) => value === selection)) select.value = selection;
}

function machineOptions() {
  const family = $("family").value;
  const entries = machines.flatMap((machine, id) =>
    !family || machine.family === family ? [[String(id), machineName(machine)]] : []);
  fillOptions("machine", "Any machine or card", entries.sort((a, b) => a[1].localeCompare(b[1], "en-GB")));
}

function options(values) {
  return [...new Set(values)].map((value) => [String(value), String(value)]);
}

function writeRecord(row, matches) {
  const tr = el("tr");
  const capacity = cell(tr, row.size);
  if (row.fit) capacity.append(el("span", row.fit, "secondary"));
  cell(tr, row.type, "memory-type");
  cell(tr, row.speed ? row.speed + " ns" : "");
  cell(tr, row.fru?.join(", "), "parts numbers");
  cell(tr, row.option?.join(", "), "parts numbers");
  const markings = cell(tr, "", "parts");
  const markingText = [row.maker, row.marking?.join(", ")].filter(Boolean).join(" · ");
  if (markingText || row.related || row.pd) markings.replaceChildren();
  if (markingText) markings.append(el("span", markingText, "numbers"));
  if (row.related) markings.append(el("span", "IBM cross-reference · " + row.related, "secondary"));
  if (row.pd) markings.append(el("span", "PD pins · " + row.pd, "secondary"));
  const machine = cell(tr, "", "machine-cell");
  if (matches.length) {
    const details = el("details");
    details.append(el("summary", matches.length + (matches.length === 1 ? " configuration" : " configurations")));
    const list = el("ul", "", "machine-list");
    matches.forEach((id) => {
      const item = el("li", machineName(machines[id]));
      if (machines[id].note) item.append(el("span", machines[id].note, "secondary"));
      list.append(item);
    });
    details.append(list);
    if (matches.length === 1) details.open = true;
    machine.replaceChildren(details);
  }
  const source = cell(tr, "", "source-cell");
  source.replaceChildren(citation(row.source));
  if (row.ref) source.append(el("span", "EPRM #" + row.ref, "secondary"));
  return tr;
}

function render() {
  const selected = Object.fromEntries(filters.map((id) => [id, $(id).value]));
  const query = $("query").value.trim().split(/\s+/).map(searchText).filter(Boolean);
  const hasScope = Boolean(selected.machine || selected.family);
  const results = records.flatMap((row) => {
    if ((selected.size && row.size !== selected.size)
        || (selected.type && (row.type || "Unspecified") !== selected.type)) return [];
    const scopes = row.machines.filter((id) => (!selected.family || machines[id].family === selected.family)
      && (!selected.machine || String(id) === selected.machine));
    if (hasScope && !scopes.length) return [];
    const matchesRow = (token) => row.searchable.some((value) => value.includes(token));
    if (query.every(matchesRow)) return [[row, scopes]];
    const matchingMachines = scopes.filter((id) => query.every((token) =>
      matchesRow(token) || machineSearch[id].some((value) => value.includes(token))));
    return matchingMachines.length ? [[row, matchingMachines]] : [];
  });
  const total = results.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  page = Math.min(page, pages);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  $("rows").replaceChildren(...results.slice(start, end).map(([row, matches]) => writeRecord(row, matches)));
  $("table-scroll").hidden = total === 0;
  $("empty").hidden = total !== 0;
  $("status").textContent = total + (total === 1 ? " matching memory record" : " matching memory records");
  $("pagination").hidden = pages <= 1;
  $("page-label").textContent = (start + 1) + "–" + end + " of " + total;
  $("previous").disabled = page === 1;
  $("next").disabled = page === pages;
}

function rerender() {
  page = 1;
  render();
}

function clearControls(query) {
  $("query").value = query;
  filters.forEach((id) => { $(id).value = ""; });
  machineOptions();
  rerender();
  $("query").focus();
}

fillOptions("family", "All families", options(machines.map((item) => item.family).sort()));
fillOptions("size", "Any capacity", options(modules.map((row) => row.size))
  .sort((a, b) => a[0].localeCompare(b[0], "en-GB", {numeric: true})));
fillOptions("type", "Any type", options(modules.map((row) => row.type || "Unspecified").sort()));
machineOptions();

$("query").addEventListener("input", rerender);
$("family").addEventListener("change", () => { machineOptions(); rerender(); });
for (const id of ["machine", "size", "type"]) $(id).addEventListener("change", rerender);
$("clear").addEventListener("click", () => clearControls(""));
document.querySelectorAll("[data-query]").forEach((button) =>
  button.addEventListener("click", () => clearControls(button.dataset.query)));
$("previous").addEventListener("click", () => { page--; render(); });
$("next").addEventListener("click", () => { page++; render(); });

render();
