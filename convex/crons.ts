import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Limpieza diaria de la tabla `uploads` (higiene del tope de subidas).
// No borra ficheros: los no válidos ya se eliminan al rechazar la
// asociación, y Storage no ofrece listado para descubrir abandonos.
const crons = cronJobs();

crons.daily(
  "higiene de intentos de subida",
  { hourUTC: 3, minuteUTC: 0 },
  internal.files.cleanupUploads,
  {},
);

export default crons;
