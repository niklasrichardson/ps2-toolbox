"use strict";

const {notes, references, identification} = window.ps2LookupData;

function renderEvidence() {
  const words = $("evidence-query").value.toLowerCase().match(/[a-z0-9]+/g) || [];
  const matches = notes.filter(([model, note]) => words.every((word) => (model + " " + note).toLowerCase().includes(word)));
  $("evidence-status").textContent = matches.length + (matches.length === 1 ? " note" : " notes");
  $("evidence-notes").replaceChildren(...matches.map(([model, note, url, title]) => {
    const item = el("li");
    item.append(el("strong", model), el("p", note), sourceLink(title, url));
    return item;
  }));
}

$("evidence-query").addEventListener("input", renderEvidence);
$("source-inventory").replaceChildren(...Object.entries(references).map(([group, documents]) => {
  const details = el("details");
  const list = el("ul");
  documents.forEach(([label, url]) => {
    const item = el("li");
    item.append(sourceLink(label, url));
    list.append(item);
  });
  details.append(el("summary", group + " (" + documents.length + ")"), list);
  return details;
}));

function renderPlanars() {
  const words = $("planar-query").value.trim().split(/\s+/).map(searchText).filter(Boolean);
  const rows = identification.planars.filter(([model, pins, note]) =>
    words.every((word) => searchText(model + " " + pins + " " + note).includes(word)));
  $("planar-status").textContent = rows.length + (rows.length === 1 ? " board entry" : " board entries");
  $("planar-rows").replaceChildren(...rows.map(([model, pins, note, url]) =>
    referenceRow([model, pins, note], "Planar reference", url)));
}

$("planar-query").addEventListener("input", renderPlanars);
window.addEventListener("hashchange", openLinkedDetails);
openLinkedDetails();
renderPlanars();
renderEvidence();
