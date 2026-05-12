const express = require("express");
const { authRequired } = require("../middleware/middleware");
const recipeController = require("../controllers/recipeController");

const router = express.Router();

router.get("/", authRequired, recipeController.list);
router.get("/:id", authRequired, recipeController.getOne);
router.post("/", authRequired, recipeController.create);
router.put("/:id", authRequired, recipeController.update);
router.delete("/:id", authRequired, recipeController.remove);
router.get("/:id/ingredients", authRequired, recipeController.getIngredients);

module.exports = router;