"use client";

export function ProviderTechnicalRecordControl({ className, label }: { readonly className: string; readonly label: string }) {
  function openTechnicalRecord() {
    const details = document.getElementById("technical-record");
    if (!(details instanceof HTMLDetailsElement)) return;
    details.open = true;
    details.scrollIntoView({ block: "start" });
    details.querySelector("summary")?.focus();
  }

  return <button type="button" className={className} onClick={openTechnicalRecord}>{label}</button>;
}
