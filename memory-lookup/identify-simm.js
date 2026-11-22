"use strict";

const {patterns} = window.ps2LookupData;
$("patterns").replaceChildren(...patterns.map(([bits, pins, size, speed, reference]) => {
  const tr = el("tr");
  [bits, pins, size ? size + " MB" : "", speed ? speed + " ns" : "", reference].forEach((value, index) =>
    cell(tr, value, index < 2 ? "numbers" : ""));
  return tr;
}));
