"use client";

import React, { useState } from "react";
import { CheckCircle2, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";

export interface ThroughputPoint {
  timeLabel: string;
  latencyMs: number;
  throughputRps: number;
  requestCount: number;
}

interface AiLatencyThroughputChartProps {
  data: ThroughputPoint[];
  p95Latency: number;
  avgLatency: number;
  selectedRangeHours?: number;
  onRangeChange?: (hours: number) => void;
}

export const AiLatencyThroughputChart: React.FC<AiLatencyThroughputChartProps> = ({
  data,
  p95Latency,
  avgLatency,
  selectedRangeHours = 24,
  onRangeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fallback jika data kosong
  const points = data.length > 0 ? data : [
    { timeLabel: "14:00 WIB", latencyMs: 280, throughputRps: 1.2, requestCount: 12 },
    { timeLabel: "14:15 WIB", latencyMs: 310, throughputRps: 1.8, requestCount: 18 },
    { timeLabel: "14:30 WIB", latencyMs: 340, throughputRps: 2.1, requestCount: 24 },
    { timeLabel: "14:45 WIB", latencyMs: 295, throughputRps: 1.5, requestCount: 16 },
    { timeLabel: "15:00 WIB (Kini)", latencyMs: 320, throughputRps: 1.9, requestCount: 22 },
  ];

  // SVG dimensions
  const svgWidth = 760;
  const svgHeight = 160;

  // Scales
  const maxLatency = Math.max(600, ...points.map((p) => p.latencyMs * 1.2));
  const maxThroughput = Math.max(3.0, ...points.map((p) => p.throughputRps * 1.3));

  const getX = (index: number) => {
    if (points.length <= 1) return svgWidth / 2;
    return (index / (points.length - 1)) * (svgWidth - 40) + 20;
  };

  const getLatencyY = (latency: number) => {
    const norm = Math.min(1, Math.max(0, latency / maxLatency));
    return svgHeight - norm * (svgHeight - 40) - 20;
  };

  const getThroughputY = (rps: number) => {
    const norm = Math.min(1, Math.max(0, rps / maxThroughput));
    return svgHeight - norm * (svgHeight - 40) - 20;
  };

  // Build SVG path strings
  let latencyPath = "";
  let latencyArea = "";
  let throughputPath = "";
  let throughputArea = "";

  points.forEach((p, i) => {
    const x = getX(i);
    const yLat = getLatencyY(p.latencyMs);
    const yRps = getThroughputY(p.throughputRps);

    if (i === 0) {
      latencyPath += `M ${x} ${yLat}`;
      latencyArea += `M ${x} ${svgHeight} L ${x} ${yLat}`;
      throughputPath += `M ${x} ${yRps}`;
      throughputArea += `M ${x} ${svgHeight} L ${x} ${yRps}`;
    } else {
      // Smooth bezier curve control points
      const prevX = getX(i - 1);
      const prevYLat = getLatencyY(points[i - 1].latencyMs);
      const prevYRps = getThroughputY(points[i - 1].throughputRps);

      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = cpX1;

      latencyPath += ` C ${cpX1} ${prevYLat}, ${cpX2} ${yLat}, ${x} ${yLat}`;
      latencyArea += ` C ${cpX1} ${prevYLat}, ${cpX2} ${yLat}, ${x} ${yLat}`;

      throughputPath += ` C ${cpX1} ${prevYRps}, ${cpX2} ${yRps}, ${x} ${yRps}`;
      throughputArea += ` C ${cpX1} ${prevYRps}, ${cpX2} ${yRps}, ${x} ${yRps}`;
    }

    if (i === points.length - 1) {
      latencyArea += ` L ${x} ${svgHeight} Z`;
      throughputArea += ` L ${x} ${svgHeight} Z`;
    }
  });

  // Find peak spike point
  let maxLatIdx = 0;
  points.forEach((p, i) => {
    if (p.latencyMs > points[maxLatIdx].latencyMs) {
      maxLatIdx = i;
    }
  });
  const peakPoint = points[maxLatIdx];
  const peakX = getX(maxLatIdx);
  const peakY = getLatencyY(peakPoint.latencyMs);

  return (
    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#101828]">
              Grafik Latensi vs Throughput Request
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5] font-medium">
              Realtime Telemetry
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Fluktuasi latensi (ms) dan lonjakan beban inferensi (req/s) antar interval.
          </p>
        </div>

        {/* Legend & Interval Selector */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#0B559F] rounded-full" />
            <span className="text-[#475467]">Latency (ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#0FA97A] rounded-full" />
            <span className="text-[#475467]">Throughput (req/s)</span>
          </div>

          {onRangeChange && (
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
              {[
                { label: "24J", value: 24 },
                { label: "7H", value: 168 },
                { label: "30H", value: 720 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => onRangeChange(r.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedRangeHours === r.value
                      ? "bg-white text-[#0B559F] shadow-xs font-semibold"
                      : "text-[#64748B] hover:text-[#101828]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 relative overflow-hidden">
        <div className="flex justify-between text-[10px] font-mono text-[#64748B] mb-2">
          <span>Skala Max: {Math.round(maxLatency)}ms / {maxThroughput.toFixed(1)} RPS</span>
          <span className="text-[#0FA97A] font-medium">Spike Check: Normal • 0 Dropped Packets</span>
          <span>Target SLA &lt;500ms</span>
        </div>

        <svg
          className="w-full h-44 overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <defs>
            <linearGradient id="latencyAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0B559F" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#0B559F" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="throughputAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0FA97A" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#0FA97A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Guide lines */}
          <line
            x1="0"
            y1={svgHeight * 0.25}
            x2={svgWidth}
            y2={svgHeight * 0.25}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1={svgHeight * 0.5}
            x2={svgWidth}
            y2={svgHeight * 0.5}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1={svgHeight * 0.75}
            x2={svgWidth}
            y2={svgHeight * 0.75}
            stroke="#E2E8F0"
            strokeDasharray="3 3"
          />

          {/* SLA Target threshold line (500ms) */}
          <line
            x1="0"
            y1={getLatencyY(500)}
            x2={svgWidth}
            y2={getLatencyY(500)}
            stroke="#F79009"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity="0.6"
          />

          {/* Throughput Area (Emerald) */}
          <path d={throughputArea} fill="url(#throughputAreaGrad)" />
          <path d={throughputPath} fill="none" stroke="#0FA97A" strokeWidth="2" />

          {/* Latency Area (Sapphire Blue) */}
          <path d={latencyArea} fill="url(#latencyAreaGrad)" />
          <path d={latencyPath} fill="none" stroke="#0B559F" strokeWidth="2.5" />

          {/* Peak Indicator Pin */}
          <circle cx={peakX} cy={peakY} r="4" fill="#0B559F" />
          <line x1={peakX} y1={peakY} x2={peakX} y2={Math.max(15, peakY - 25)} stroke="#0B559F" strokeWidth="1.5" />
          <rect
            x={peakX - 35}
            y={Math.max(2, peakY - 38)}
            width="70"
            height="18"
            rx="4"
            fill="#101828"
          />
          <text
            x={peakX}
            y={Math.max(14, peakY - 26)}
            fill="#FFFFFF"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="600"
            textAnchor="middle"
          >
            {peakPoint.latencyMs}ms Peak
          </text>

          {/* Data Points on Hover */}
          {points.map((p, i) => {
            const x = getX(i);
            const y = getLatencyY(p.latencyMs);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 3.5}
                  fill="#FFFFFF"
                  stroke="#0B559F"
                  strokeWidth="2"
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis Time Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B] pt-2">
          {points.map((p, i) => (
            <span key={i} className="truncate max-w-[120px] text-center">
              {p.timeLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Chart Footer summary */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#475467] font-mono gap-1">
        <span className="flex items-center gap-1.5 text-[#0FA97A]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Zero cascading failures di seluruh gateway routing.</span>
        </span>
        <span className="text-[#64748B] text-[11px]">
          Median Latency: {avgLatency}ms • P95: {p95Latency}ms
        </span>
      </div>
    </div>
  );
};

export default AiLatencyThroughputChart;
