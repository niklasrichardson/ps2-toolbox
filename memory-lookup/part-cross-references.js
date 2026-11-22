"use strict";

const {modules, identification} = window.ps2LookupData;

const knownOptions = new Map();
function addOption(option, fru) {
  if (!knownOptions.has(option)) knownOptions.set(option, new Set());
  knownOptions.get(option).add(fru);
}
for (const [option, fru] of identification.ibmFrus) addOption(option, fru);
for (const row of modules) for (const option of row.option || []) {
  for (const fru of row.fru || []) addOption(option, fru);
}

function renderAlternatives() {
  const query = searchText($("alternative-query").value);
  const includes = (part) => searchText(part).includes(query);
  const oem = identification.alternatives.filter(([option, part]) => !query || [option, part,
    ...(knownOptions.get(option) || [])].some(includes));
  const ibm = query ? identification.ibmFrus.filter((pair) => pair.some(includes)) : [];
  $("alternative-status").textContent = query ? (oem.length + ibm.length) + " matching records" :
    oem.length + " OEM references. Enter a number to include IBM option-to-FRU matches.";
  $("alternative-rows").replaceChildren(
    ...oem.map(([option, part, note, title, url]) => referenceRow([option, part, note], title, url)),
    ...ibm.map(([option, fru]) => referenceRow([option, fru, "IBM option-to-FRU mapping"],
      "IBM EPRM", identification.ibmFruUrl)));
}

function renderChipMatches() {
  const query = searchText($("chip-query").value);
  const matches = query ? identification.chipGroups.filter(([group, chips]) =>
    searchText(group).includes(query) || chips.some(([maker, part]) =>
      searchText(maker + part).includes(query) || query.includes(searchText(part)))) : [];
  const rows = query ? matches.map(([group, chips]) =>
    [group, chips.map(([maker, part]) => maker + " " + part).join(" · ")]) :
    identification.chips.map(([group, example, alternatives]) => [group, example + " · " + alternatives]);
  $("chip-status").textContent = query ? rows.length + " chart rows" : "Examples from the conversion chart.";
  $("chip-results").replaceChildren(...rows.map(([group, chips]) => {
    const li = el("li");
    li.append(el("strong", group), el("p", chips), sourceLink("Ardent chip conversion chart", identification.chipUrl));
    return li;
  }));
}

function renderPinout() {
  const [name, url, pins] = identification.pinouts[Number($("pin-profile").value)];
  const model80 = name.startsWith("Model 80");
  const groups = model80 ? ["A", "B", "C"].map((row) => pins.filter(([pin]) => pin.startsWith(row))) : [pins];
  let selected;
  $("pin-state").textContent = "Select a contact.";
  $("pin-grid").replaceChildren(...groups.map((group) => {
    const container = el("div", "", model80 ? "pin-group planar" : "pin-group");
    container.append(...group.map(([pin, signal]) => {
      const kind = signal.startsWith("+5") ? "pin-power" : signal === "Ground" ? "pin-ground" :
        signal.startsWith("Presence Detect") ? "pin-detect" : "";
      const button = el("button", pin, "pin " + kind);
      button.type = "button";
      button.title = signal;
      button.setAttribute("aria-label", pin + " · " + signal);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        selected?.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-pressed", "true");
        selected = button;
        $("pin-state").textContent = "Pin " + pin + " · " + signal;
      });
      return button;
    }));
    return container;
  }));
  $("pin-source").replaceChildren(sourceLink("Source diagram and variant notes", url));
  if (model80) {
    $("pin-source").append(" · ", sourceLink("IBM Type 3 pin table", identification.model80Manual),
      " · A16 and A18 are reserved on Types 1 and 2.");
  }
}

function renderSourceList(id, links) {
  $(id).replaceChildren(...links.map(([title, url]) => {
    const li = el("li");
    li.append(sourceLink(title, url));
    return li;
  }));
}

$("adapter-rows").replaceChildren(...identification.adapters.map(([marks, ids, pins, note, url]) => {
  const tr = referenceRow([marks, ids, pins, note], "Ardent expansion adapter reference", url);
  if (ids) {
    tr.cells[1].replaceChildren();
    ids.split(" / ").forEach((id, index) => {
      if (index) tr.cells[1].append(" / ");
      tr.cells[1].append(sourceLink(id, window.ps2Page(document.querySelector(".toolbox-nav [data-tool=mca]").getAttribute("href")) + "#q=" + encodeURIComponent(id)));
    });
  }
  return tr;
}));
renderSourceList("guide-links", identification.guides);
renderSourceList("pin-references", identification.pinReferences);
$("pin-profile").replaceChildren(...identification.pinouts.map(([title], index) => new Option(title, String(index))));
$("pin-profile").value = "1";
$("alternative-query").addEventListener("input", renderAlternatives);
$("chip-query").addEventListener("input", renderChipMatches);
$("pin-profile").addEventListener("change", renderPinout);

window.addEventListener("hashchange", openLinkedDetails);
openLinkedDetails();
renderAlternatives();
renderChipMatches();
renderPinout();
