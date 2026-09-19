import { Card, CardContent, CardMedia, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import type { Author } from "../domain/authors";

type AuthorsGridProps = {
  authors: readonly Author[];
};

export default function AuthorsGrid({ authors }: AuthorsGridProps) {
  return (
    <Grid container spacing={4}>
      {authors.map((author, index) => (
        <Grid key={`${author.name}-${index}`} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 2,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              },
            }}
          >
            <CardMedia
              component="img"
              height="240"
              image={author.image}
              alt={author.name}
              sx={{ objectFit: "cover" }}
            />
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#1E6B73",
                  mb: 0.5,
                  fontSize: "1.1rem",
                }}
              >
                {author.name}
              </Typography>
              <Typography sx={{ color: "#5FA8B0", fontSize: "0.9rem" }}>
                {author.specialty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
