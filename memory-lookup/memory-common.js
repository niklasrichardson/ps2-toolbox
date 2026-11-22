"use strict";

const $ = (id) => document.getElementById(id);
const searchText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

function el(tag, value, className) {
  const element = document.createElement(tag);
  if (value) element.textContent = value;
  if (className) element.className = className;
  return element;
}

function cell(tr, value, className) {
  return tr.appendChild(el("td", value || "—", className));
}

function sourceLink(label, url) {
  const link = el("a", label, "cds--link");
  link.href = url;
  return link;
}

function referenceRow(values, title, url) {
  const tr = el("tr");
  for (const value of values) cell(tr, value);
  cell(tr).replaceChildren(sourceLink(title, url));
  return tr;
}

function openLinkedDetails() {
  const target = $(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement) target.open = true;
}
