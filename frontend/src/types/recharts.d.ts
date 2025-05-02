declare module 'recharts' {
  import * as React from 'react';

  // Basic component props
  export interface BaseProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  // Chart components
  export const BarChart: React.FC<any>;
  export const LineChart: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const AreaChart: React.FC<any>;
  export const ComposedChart: React.FC<any>;
  export const ScatterChart: React.FC<any>;
  export const RadarChart: React.FC<any>;
  export const RadialBarChart: React.FC<any>;
  export const SankeyChart: React.FC<any>;
  export const Treemap: React.FC<any>;

  // Axis components
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const ZAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const PolarGrid: React.FC<any>;
  export const PolarAngleAxis: React.FC<any>;
  export const PolarRadiusAxis: React.FC<any>;

  // Shape components
  export const Bar: React.FC<any>;
  export const Line: React.FC<any>;
  export const Area: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Scatter: React.FC<any>;
  export const Radar: React.FC<any>;
  export const RadialBar: React.FC<any>;
  export const Sankey: React.FC<any>;
  export const Cell: React.FC<any>;

  // Helper components
  export const Legend: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const ResponsiveContainer: React.FC<any>;
  export const Brush: React.FC<any>;
  export const Label: React.FC<any>;
  export const ReferenceArea: React.FC<any>;
  export const ReferenceDot: React.FC<any>;
  export const ReferenceLine: React.FC<any>;
  
  // Type definitions
  export type ValueType = string | number | Array<string | number>;
  export type NameType = string | number;
  export type Margin = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
} 