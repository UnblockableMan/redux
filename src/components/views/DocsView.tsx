"use client";

export function DocsView() {
  return (
    <div className="h-full bg-white">
      <iframe
        src="https://docs.google.com/document/d/1h7Pa1D5CoTZ2AFcFhjJaM24G8HeXf9W1d_wRhFeCMIQ/edit?usp=sharing&embedded=true"
        className="h-full w-full border-0"
        title="Google Doc"
        allow="fullscreen"
      />
    </div>
  );
}
