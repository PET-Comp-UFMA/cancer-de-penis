import { Box, Typography } from "@mui/material";

const GREEN = "#015D67";
const TRACK = "#D9D9D9";
const TEXT_DARK = "#0F3C3E";

const WIDTH = 240;
const HEIGHT = 132;
const RADIUS = 100;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 118;
const STROKE_WIDTH = 22;
const ARC_LENGTH = Math.PI * RADIUS;

// M <left point> A <radius,radius> <rotation> <large-arc> <sweep> <right point>
// draws the top half of the circle (left -> over the top -> right).
const ARC_PATH = `M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`;

type RiskGaugeProps = {
  percentage: number;
  caption?: string;
};

export default function RiskGauge({ percentage, caption = "Porcentagem de Risco" }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledLength = (clamped / 100) * ARC_LENGTH;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box sx={{ position: "relative", width: WIDTH + 40, height: HEIGHT + 8 }}>
        <svg
          role="img"
          aria-label={`${clamped}% de risco`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height="100%"
        >
          <path d={ARC_PATH} fill="none" stroke={TRACK} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <path
            d={ARC_PATH}
            fill="none"
            stroke={GREEN}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH - filledLength}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            top: "60%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            component="p"
            sx={{ color: TEXT_DARK, fontSize: { xs: 36, sm: 44 }, fontWeight: 800, lineHeight: 1 }}
          >
            {clamped}%
          </Typography>
        </Box>
      </Box>
      <Typography component="p" sx={{ color: TEXT_DARK, fontSize: 15 }}>
        {caption}
      </Typography>
    </Box>
  );
}
