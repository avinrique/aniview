import { Router } from "express";
import {
  featured, search, animeDetails, episode,
  genres, genre, popular, topRated, recent,
  related, sourcesStatus,
} from "../controllers/animeController.js";

const router = Router();

router.get("/featured", featured);
router.get("/search", search);
router.get("/genres", genres);
router.get("/genre/:genre", genre);
router.get("/popular", popular);
router.get("/top-rated", topRated);
router.get("/recent", recent);
router.get("/related", related);
router.get("/anime/:animeId", animeDetails);
router.get("/episode/:animeId/:episodeNumber", episode);
router.get("/sources/status", sourcesStatus);

export default router;
