"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  const inputDigit = (d: string) => {
    if (overwrite) {
      setDisplay(d === "." ? "0." : d);
      setOverwrite(false);
    } else {
      if (d === "." && display.includes(".")) return;
      setDisplay(display === "0" && d !== "." ? d : display + d);
    }
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const inputOp = (nextOp: string) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !overwrite) {
      const result = compute(prev, cur, op);
      setPrev(result);
      setDisplay(String(result));
    } else {
      setPrev(cur);
    }
    setOp(nextOp);
    setOverwrite(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const result = compute(prev, cur, op);
    setDisplay(isNaN(result) ? "Error" : String(result));
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const toggleSign = () => {
    setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d));
  };

  const percent = () => {
    setDisplay((d) => String(parseFloat(d) / 100));
  };

  return (
    <div className="flex h-full flex-col bg-background p-4">
      {/* Display */}
      <div className="mb-4 flex flex-1 flex-col items-end justify-end rounded-xl bg-white/5 p-4">
        {op && prev !== null && (
          <div className="text-sm text-muted-foreground">{prev} {op}</div>
        )}
        <div className="truncate text-4xl font-light tabular-nums">{display}</div>
      </div>

      {/* Buttons */}
      <div className="grid flex-1 grid-cols-4 gap-2">
        <CalcBtn label="AC" onClick={clear} variant="fn" />
        <CalcBtn label="±" onClick={toggleSign} variant="fn" />
        <CalcBtn label="%" onClick={percent} variant="fn" />
        <CalcBtn label="÷" onClick={() => inputOp("÷")} variant="op" />

        <CalcBtn label="7" onClick={() => inputDigit("7")} />
        <CalcBtn label="8" onClick={() => inputDigit("8")} />
        <CalcBtn label="9" onClick={() => inputDigit("9")} />
        <CalcBtn label="×" onClick={() => inputOp("×")} variant="op" />

        <CalcBtn label="4" onClick={() => inputDigit("4")} />
        <CalcBtn label="5" onClick={() => inputDigit("5")} />
        <CalcBtn label="6" onClick={() => inputDigit("6")} />
        <CalcBtn label="−" onClick={() => inputOp("−")} variant="op" />

        <CalcBtn label="1" onClick={() => inputDigit("1")} />
        <CalcBtn label="2" onClick={() => inputDigit("2")} />
        <CalcBtn label="3" onClick={() => inputDigit("3")} />
        <CalcBtn label="+" onClick={() => inputOp("+")} variant="op" />

        <CalcBtn label="0" onClick={() => inputDigit("0")} />
        <CalcBtn label="." onClick={() => inputDigit(".")} />
        <button
          onClick={equals}
          className="col-span-2 flex items-center justify-center rounded-xl bg-primary text-lg font-medium text-primary-foreground transition-all active:scale-95 hover:opacity-90"
        >
          =
        </button>
      </div>
    </div>
  );
}

function CalcBtn({ label, onClick, variant }: { label: string; onClick: () => void; variant?: "op" | "eq" | "fn" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-full items-center justify-center rounded-xl text-lg font-medium transition-all active:scale-95",
        variant === "op" && "bg-primary/20 text-primary hover:bg-primary/30",
        variant === "eq" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "fn" && "bg-white/5 text-muted-foreground hover:bg-white/10",
        !variant && "bg-white/5 text-foreground hover:bg-white/10",
      )}
    >
      {label}
    </button>
  );
}
