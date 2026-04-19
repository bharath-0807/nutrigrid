import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Generate points for a Standard Normal Distribution (Bell Curve)
const generateBellCurve = (childZ) => {
  const points = [];
  for (let x = -4; x <= 4; x += 0.2) {
    // Normal Distribution PDF formula
    const y = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow(x, 2));
    points.push({ x: parseFloat(x.toPrecision(2)), y });
  }
  return points;
};

export default function ZScoreCurve({ zScore, label, type }) {
  const data = generateBellCurve(zScore);
  
  // Determine color based on severity
  const color = zScore < -3 ? "#E11D48" : zScore < -2 ? "#F59E0B" : "#10B981";
  const bg = zScore < -3 ? "#FFF1F2" : zScore < -2 ? "#FFFBEB" : "#ECFDF5";

  return (
    <div className="card" style={{ padding: 16, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Global Population Distribution</h4>
          <p style={{ fontSize: 11, color: "#64748B" }}>{type} - WHO Multi-centre Standards</p>
        </div>
        <div style={{ padding: "4px 10px", borderRadius: 6, background: bg, color: color, fontSize: 12, fontWeight: 700, border: `1px solid ${color}40` }}>
          Z: {zScore.toFixed(2)}
        </div>
      </div>

      <div style={{ height: 180, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={[-4, 4]} 
              ticks={[-3, -2, -1, 0, 1, 2, 3]}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, 0.5]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: '#fff', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 10 }}>
                      Population Density
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="y" 
              stroke="#2563EB" 
              fill="url(#popGrad)" 
              strokeWidth={2} 
              dot={false}
              activeDot={false}
            />
            {/* The Child's Position */}
            <ReferenceLine 
              x={zScore} 
              stroke={color} 
              strokeWidth={3} 
              strokeDasharray="4 2"
              label={{ 
                value: "Patient", 
                position: 'top', 
                fill: color, 
                fontSize: 11, 
                fontWeight: 800,
                style: { textTransform: 'uppercase' }
              }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
        <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}>
          {zScore < -3 ? (
            <>⚠️ <strong>Severe Deviation:</strong> This child is in the bottom <span style={{color:"#E11D48"}}>0.1%</span> of the global population. This is a clinical emergency requiring immediate NRC intervention.</>
          ) : zScore < -2 ? (
            <>⚠️ <strong>Moderate Deviation:</strong> This child is in the bottom <span style={{color:"#F59E0B"}}>2.3%</span>. Targeted nutritional supplementation (MAM protocol) is required.</>
          ) : (
            <>✅ <strong>Normal:</strong> This child is within the expected <span style={{color:"#10B981"}}>95%</span> of the global population. Continue routine monitoring.</>
          )}
        </p>
      </div>
    </div>
  );
}
